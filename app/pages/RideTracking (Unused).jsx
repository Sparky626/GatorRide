import React, { useState, useEffect, useContext, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { UserDetailContext } from "@/context/UserDetailContext";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import { debounce } from "lodash";

// Debounced Firestore update function
const updateFirestoreLocation = debounce(async (location, locationField, requestId) => {
  try {
    await updateDoc(doc(db, "ride_requests", requestId), {
      [locationField]: location,
    });
  } catch (error) {
    console.error("Error updating Firestore location:", error);
  }
}, 1000);

// Geocode address to coordinates
const geocodeAddress = async (address) => {
  console.log("Geocoding address:", address);
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo`
    );
    const data = await response.json();
    if (data.status === "OK") {
      const { lat, lng } = data.results[0].geometry.location;
      const result = { latitude: lat, longitude: lng };
      console.log("Geocoded coordinates:", result);
      return result;
    }
    throw new Error(`Geocoding failed: ${data.status}`);
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// Fetch Directions API data for Polyline fallback
const fetchDirections = async (origin, destination, apiKey) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error(`Directions API error: ${data.status}`);
    }
    const points = decodePolyline(data.routes[0].overview_polyline.points);
    return points;
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
};

// Decode Google Maps polyline
const decodePolyline = (encoded) => {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

export default function RideTracking() {
  const { userDetail } = useContext(UserDetailContext);
  const { requestId } = useLocalSearchParams();
  const router = useRouter();
  const [rideRequest, setRideRequest] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);

  useEffect(() => {
    if (!requestId || !userDetail?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "ride_requests", requestId),
      (doc) => {
        if (doc.exists()) {
          setRideRequest({ id: doc.id, ...doc.data() });
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Ride request no longer exists.",
          });
          router.replace("/home");
        }
      },
      (error) => {
        console.error("Error fetching ride request:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load ride request.",
        });
      }
    );

    let locationSubscription;
    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required.");
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (location) => {
            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });
            const locationField = userDetail.isDriver ? "driver_location" : "rider_location";
            updateFirestoreLocation({ latitude, longitude }, locationField, requestId);
          }
        );
      } catch (error) {
        console.error("Error starting location tracking:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to start location tracking.",
        });
      }
    };

    startLocationTracking();

    return () => {
      unsubscribe();
      if (locationSubscription) locationSubscription.remove();
      updateFirestoreLocation.cancel();
    };
  }, [requestId, userDetail]);

  // Geocode destination if it’s an address
  useEffect(() => {
    if (!rideRequest?.destination) {
      setDestinationCoords(null);
      return;
    }

    const resolveDestination = async () => {
      const coords = await parseCoordinates(rideRequest.destination);
      setDestinationCoords(coords);
    };

    resolveDestination();
  }, [rideRequest?.destination]);

  // Resolve riderLocation
  useEffect(() => {
    if (!rideRequest) {
      setRiderLocation(null);
      return;
    }

    const resolveRiderLocation = async () => {
      if (rideRequest.rider_location) {
        setRiderLocation(rideRequest.rider_location);
      } else if (rideRequest.origin) {
        const coords = await parseCoordinates(rideRequest.origin);
        setRiderLocation(coords);
      } else {
        setRiderLocation(null);
      }
    };

    resolveRiderLocation();
  }, [rideRequest?.rider_location, rideRequest?.origin]);

  const parseCoordinates = async (coordString) => {
    console.log("Parsing coordinates:", coordString);
    try {
      // Try parsing as "latitude,longitude"
      const [lat, lon] = coordString.split(",").map(parseFloat);
      if (!isNaN(lat) && !isNaN(lon)) {
        const result = { latitude: lat, longitude: lon };
        console.log("Parsed coordinates:", result);
        return result;
      }
      // If not coordinates, try geocoding as an address
      const coords = await geocodeAddress(coordString);
      if (coords) {
        return coords;
      }
      throw new Error("Invalid coordinates or address");
    } catch (error) {
      console.error("Coordinate parsing error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid destination address.",
      });
      return { latitude: 29.6516, longitude: -82.3248 }; // Default to Gainesville, FL
    }
  };

  const driverLocation = rideRequest?.driver_location;

  // Fetch route for Polyline fallback
  useEffect(() => {
    if (!riderLocation || !destinationCoords) {
      setRouteCoordinates(null);
      return;
    }

    const loadRoute = async () => {
      const points = await fetchDirections(riderLocation, destinationCoords, "AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo");
      setRouteCoordinates(points);
    };

    loadRoute();
  }, [riderLocation, destinationCoords]);

  const region = useMemo(() => {
    if (!userLocation) {
      return null;
    }
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [userLocation?.latitude, userLocation?.longitude]);

  const cancelRide = () => {
    Alert.alert(
      "Confirm Cancellation",
      `Are you sure you want to ${userDetail.isDriver ? "cancel the ride" : "cancel the request"}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            if (!rideRequest) return;
            try {
              if (userDetail.isDriver) {
                await updateDoc(doc(db, "ride_requests", rideRequest.id), {
                  status: "pending",
                  driver_id: null,
                  driver: null,
                  driver_location: null,
                });
                Toast.show({
                  type: "success",
                  text1: "Ride Cancelled",
                  text2: "You have cancelled the ride.",
                });
              } else {
                await deleteDoc(doc(db, "ride_requests", rideRequest.id));
                Toast.show({
                  type: "success",
                  text1: "Ride Request Cancelled",
                  text2: "Your ride request has been cancelled.",
                });
              }
              router.replace("/home");
            } catch (error) {
              console.error("Error cancelling ride:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to cancel ride.",
              });
            }
          },
        },
      ]
    );
  };

  if (!rideRequest || !userLocation || !riderLocation || !region) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
      >
        {userDetail.isDriver && riderLocation && (
          <Marker
            coordinate={riderLocation}
            title="Rider"
            description={rideRequest.riderName}
            pinColor="red"
          />
        )}
        {!userDetail.isDriver && driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description={rideRequest.driver?.first_name || "Driver"}
            pinColor="blue"
          />
        )}
        {destinationCoords && (
          <MapViewDirections
            origin={riderLocation}
            destination={destinationCoords}
            apikey="AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo"
            strokeWidth={3}
            strokeColor="blue"
            region="US"
            precision="high"
            onReady={(result) => {
              console.log("Directions result:", JSON.stringify(result, null, 2));
            }}
            onError={(error) => {
              console.error("MapViewDirections error:", JSON.stringify(error, null, 2));
              Toast.show({
                type: "error",
                text1: "Route Error",
                text2: "Failed to load route. Using fallback.",
              });
            }}
          />
        )}
        {routeCoordinates && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="blue"
            strokeWidth={3}
          />
        )}
      </MapView>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {userDetail.isDriver
            ? `Rider: ${rideRequest.riderName}`
            : `Driver: ${rideRequest.driver?.first_name || "N/A"} ${
                rideRequest.driver?.last_name || ""
              }`}
        </Text>
        <Text style={styles.infoText}>From: {rideRequest.origin}</Text>
        <Text style={styles.infoText}>To: {rideRequest.destination}</Text>
      </View>
      <TouchableOpacity
        style={[styles.cancelButton, userDetail.isDriver ? styles.driverCancel : styles.riderCancel]}
        onPress={cancelRide}
      >
        <Text style={styles.cancelButtonText}>
          {userDetail.isDriver ? "Cancel Ride" : "Cancel Request"}
        </Text>
      </TouchableOpacity>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  infoContainer: {
    backgroundColor: "#1a2a9b",
    padding: 15,
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  infoText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    marginBottom: 5,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    margin: 10,
    alignItems: "center",
    width: "90%",
  },
  riderCancel: {
    backgroundColor: "#f3400d",
  },
  driverCancel: {
    backgroundColor: "#888",
  },
  cancelButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    textTransform: "uppercase",
  },
  loadingText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 10,
  },
});