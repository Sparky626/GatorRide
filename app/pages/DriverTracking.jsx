import React, { useState, useEffect, useContext, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { UserDetailContext } from "@/context/UserDetailContext";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import { updateFirestoreLocation, geocodeAddress, fetchDirections } from "../../utils/mapUtils";

export default function DriverTracking() {
  const { userDetail } = useContext(UserDetailContext);
  const { requestId } = useLocalSearchParams();
  const router = useRouter();
  const [rideRequest, setRideRequest] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [hasShownPickupModal, setHasShownPickupModal] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [hasShownDestinationModal, setHasShownDestinationModal] = useState(false);
  const [pickupConfirmedAt, setPickupConfirmedAt] = useState(null);
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    if (!requestId || !userDetail?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "ride_requests", requestId),
      (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
          setRideRequest(data);
          console.log("DriverTracking ride request:", JSON.stringify(data, null, 2));
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
            updateFirestoreLocation({ latitude, longitude }, "driver_location", requestId);
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

  useEffect(() => {
    if (
      !userLocation ||
      !riderLocation ||
      hasShownPickupModal ||
      rideRequest?.status === "picked_up"
    ) {
      return;
    }

    const calculateDistance = (loc1, loc2) => {
      const toRad = (value) => (value * Math.PI) / 180;
      const R = 6371e3;
      const lat1 = loc1.latitude;
      const lat2 = loc2.latitude;
      const lon1 = loc1.longitude;
      const lon2 = loc2.longitude;

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const distance = calculateDistance(userLocation, riderLocation);
    console.log("Pickup distance:", distance, "meters");
    if (distance <= 50) {
      setPickupModalVisible(true);
      setHasShownPickupModal(true);
      setTimer(5);
    }
  }, [userLocation, riderLocation, hasShownPickupModal, rideRequest?.status]);

  useEffect(() => {
    if (
      !userLocation ||
      !destinationCoords ||
      rideRequest?.status !== "picked_up" ||
      hasShownDestinationModal ||
      destinationModalVisible ||
      !pickupConfirmedAt
    ) {
      return;
    }

    // Check if 30 seconds have passed since pickup confirmation
    const timeSincePickup = (Date.now() - pickupConfirmedAt) / 1000;
    if (timeSincePickup < 30) {
      console.log(`Waiting for 30s post-pickup: ${timeSincePickup.toFixed(1)}s elapsed`);
      return;
    }

    const calculateDistance = (loc1, loc2) => {
      const toRad = (value) => (value * Math.PI) / 180;
      const R = 6371e3;
      const lat1 = loc1.latitude;
      const lat2 = loc2.latitude;
      const lon1 = loc1.longitude;
      const lon2 = loc2.longitude;

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    try {
      console.log("Checking destination distance:", {
        userLocation,
        destinationCoords,
        status: rideRequest?.status,
        timeSincePickup: timeSincePickup.toFixed(1),
      });
      const distance = calculateDistance(userLocation, destinationCoords);
      console.log("Destination distance:", distance, "meters");
      if (distance <= 50) {
        console.log("Triggering Confirm Drop-off modal");
        setDestinationModalVisible(true);
        setHasShownDestinationModal(true);
        setTimer(5);
      }
    } catch (error) {
      console.error("Error calculating destination distance:", error);
    }
  }, [userLocation, destinationCoords, rideRequest?.status, hasShownDestinationModal, destinationModalVisible, pickupConfirmedAt]);

  useEffect(() => {
    if (!pickupModalVisible && !destinationModalVisible || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [pickupModalVisible, destinationModalVisible, timer]);

  const parseCoordinates = async (coordString) => {
    console.log("Parsing coordinates:", coordString);
    try {
      if (!coordString) {
        throw new Error("Coordinate string is empty or undefined");
      }
      const [lat, lon] = coordString.split(",").map(parseFloat);
      if (!isNaN(lat) && !isNaN(lon)) {
        const result = { latitude: lat, longitude: lon };
        console.log("Parsed coordinates:", result);
        return result;
      }
      const coords = await geocodeAddress(coordString);
      if (coords) {
        console.log("Geocoded coordinates:", coords);
        return coords;
      }
      throw new Error("Invalid coordinates or address");
    } catch (error) {
      console.error("Coordinate parsing error:", error.message);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid address format.",
      });
      return { latitude: 29.6516, longitude: -82.3248 }; // Fallback coordinates
    }
  };

  useEffect(() => {
    if (!riderLocation || !destinationCoords) {
      setRouteCoordinates(null);
      return;
    }

    const loadRoute = async () => {
      try {
        const points = await fetchDirections(riderLocation, destinationCoords, "AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo");
        setRouteCoordinates(points);
      } catch (error) {
        console.error("Error loading route:", error);
      }
    };

    loadRoute();
  }, [riderLocation, destinationCoords]);

  const region = useMemo(() => {
    if (!userLocation) return null;
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
      "Are you sure you want to cancel the ride?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            if (!rideRequest) return;
            try {
              await updateDoc(doc(db, "ride_requests", rideRequest.id), {
                status: "pending",
                driver_id: null,
                driver_email: null,
                driver: null,
                driver_location: null,
              });
              Toast.show({
                type: "success",
                text1: "Ride Cancelled",
                text2: "You have cancelled the ride.",
              });
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

  const confirmPickup = async () => {
    if (!rideRequest) return;
    try {
      console.log("Confirming pickup for ride:", rideRequest.id);
      await updateDoc(doc(db, "ride_requests", rideRequest.id), {
        status: "picked_up",
      });
      setPickupConfirmedAt(Date.now());
      Toast.show({
        type: "success",
        text1: "Pickup Confirmed",
        text2: "You have confirmed picking up the rider.",
      });
      setPickupModalVisible(false);
    } catch (error) {
      console.error("Error confirming pickup:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to confirm pickup.",
      });
    }
  };

  const confirmDropOff = async () => {
    if (!rideRequest) return;
    try {
      console.log("Confirming drop-off for ride:", rideRequest.id);
      await updateDoc(doc(db, "ride_requests", rideRequest.id), {
        status: "drop_off_confirmed",
      });
      Toast.show({
        type: "success",
        text1: "Drop-off Confirmed",
        text2: "You have confirmed dropping off the rider.",
      });
      setDestinationModalVisible(false);
    } catch (error) {
      console.error("Error confirming drop-off:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to confirm drop-off.",
      });
    }
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
        {rideRequest.status !== "picked_up" && riderLocation && (
          <Marker
            coordinate={riderLocation}
            title="Rider"
            description={rideRequest.riderName}
            pinColor="red"
          />
        )}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            description={rideRequest.destination}
            pinColor="green"
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
        <Text style={styles.infoText}>Rider: {rideRequest.riderName}</Text>
        <Text style={styles.infoText}>From: {rideRequest.origin}</Text>
        <Text style={styles.infoText}>To: {rideRequest.destination}</Text>
      </View>
      <TouchableOpacity style={[styles.cancelButton, styles.driverCancel]} onPress={cancelRide}>
        <Text style={styles.cancelButtonText}>Cancel Ride</Text>
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={pickupModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Have you picked up the rider?</Text>
            <Text style={styles.modalText}>Rider: {rideRequest?.riderName || "N/A"}</Text>
            <TouchableOpacity
              style={[styles.confirmButton, timer > 0 && styles.disabledButton]}
              onPress={confirmPickup}
              disabled={timer > 0}
            >
              <Text style={styles.confirmButtonText}>
                Yes {timer > 0 ? `(${timer}s)` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={destinationModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Drop-off</Text>
            <Text style={styles.modalText}>
              Have you dropped off {rideRequest?.riderName || "the rider"} at {rideRequest?.destination || "the destination"}?
            </Text>
            <TouchableOpacity
              style={[styles.confirmButton, timer > 0 && styles.disabledButton]}
              onPress={confirmDropOff}
              disabled={timer > 0}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Drop-off {timer > 0 ? `(${timer}s)` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a2a9b",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    color: "#eb7f05",
    fontFamily: "oswald-bold",
    fontSize: 20,
    marginBottom: 10,
  },
  modalText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#eb7f05",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  disabledButton: {
    backgroundColor: "#888",
    opacity: 0.6,
  },
});