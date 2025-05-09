import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Rating } from "react-native-elements";
import { UserDetailContext } from "@/context/UserDetailContext";
import {
  doc,
  onSnapshot,
  deleteDoc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  updateFirestoreLocation,
  geocodeAddress,
  fetchDirections,
} from "../../utils/mapUtils";

export default function RiderTracking() {
  const { userDetail } = useContext(UserDetailContext);
  const { requestId } = useLocalSearchParams();
  const router = useRouter();
  const [rideRequest, setRideRequest] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [arrivalModalVisible, setArrivalModalVisible] = useState(false);
  const [hasShownArrivalModal, setHasShownArrivalModal] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [hasShownRatingModal, setHasShownRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [timer, setTimer] = useState(5);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!requestId || !userDetail?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "ride_requests", requestId),
      (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
          setRideRequest(data);
          console.log("Ride request data:", JSON.stringify(data, null, 2));
          console.log(
            "Driver car image URL:",
            data?.driver?.car_details?.image_url
          );
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
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });
            updateFirestoreLocation(
              { latitude, longitude },
              "rider_location",
              requestId
            );
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
      !rideRequest?.driver_location ||
      !riderLocation ||
      hasShownArrivalModal ||
      rideRequest.status === "picked_up"
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
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const distance = calculateDistance(
      rideRequest.driver_location,
      riderLocation
    );
    if (distance <= 50) {
      setArrivalModalVisible(true);
      setHasShownArrivalModal(true);
      setTimer(5);
    }
  }, [
    rideRequest?.driver_location,
    riderLocation,
    hasShownArrivalModal,
    rideRequest?.status,
  ]);

  useEffect(() => {
    if (rideRequest?.status !== "drop_off_confirmed" || hasShownRatingModal) {
      return;
    }

    setRatingModalVisible(true);
    setHasShownRatingModal(true);
    setTimer(5);
  }, [rideRequest?.status, hasShownRatingModal]);

  useEffect(() => {
    if ((!arrivalModalVisible && !ratingModalVisible) || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [arrivalModalVisible, ratingModalVisible, timer]);

  const parseCoordinates = async (coordString) => {
    console.log("Parsing coordinates:", coordString);
    try {
      const [lat, lon] = coordString.split(",").map(parseFloat);
      if (!isNaN(lat) && !isNaN(lon)) {
        const result = { latitude: lat, longitude: lon };
        console.log("Parsed coordinates:", result);
        return result;
      }
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
        text2: "Invalid address.",
      });
      return { latitude: 29.6516, longitude: -82.3248 };
    }
  };

  useEffect(() => {
    if (!riderLocation || !destinationCoords) {
      setRouteCoordinates(null);
      return;
    }

    const loadRoute = async () => {
      const points = await fetchDirections(
        riderLocation,
        destinationCoords,
        "AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo"
      );
      setRouteCoordinates(points);
    };

    loadRoute();
  }, [riderLocation, destinationCoords]);

  // Optional: Dynamic zoom to fit all markers
  /*
  useEffect(() => {
    if (!mapRef.current || !userLocation || !riderLocation || !destinationCoords) return;

    const coordinates = [
      userLocation,
      riderLocation,
      destinationCoords,
    ].filter(coord => coord);

    if (coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [userLocation, riderLocation, destinationCoords]);
  */

  const region = useMemo(() => {
    if (!userLocation) return null;
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.005, // Closer zoom
      longitudeDelta: 0.005, // Closer zoom
    };
  }, [userLocation?.latitude, userLocation?.longitude]);

  const cancelRide = () => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel the request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            if (!rideRequest) return;
            try {
              await deleteDoc(doc(db, "ride_requests", rideRequest.id));
              Toast.show({
                type: "success",
                text1: "Ride Request Cancelled",
                text2: "Your ride request has been cancelled.",
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

  const handleImageError = () => {
    setImageError(true);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Failed to load car image.",
    });
  };

  const submitRating = async () => {
    if (!rideRequest || !rating) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a rating.",
      });
      return;
    }

    if (!rideRequest.driver_email) {
      console.error(
        "Missing driver_email in rideRequest:",
        JSON.stringify(rideRequest, null, 2)
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Driver information is missing.",
      });
      return;
    }

    try {
      // Calculate ride_time in minutes
      const createdAt = rideRequest.createdAt
        ? new Date(rideRequest.createdAt)
        : new Date();
      const now = new Date();
      const ride_time = Math.round((now - createdAt) / (1000 * 60));

      // Update driver's rating
      const driverDocRef = doc(db, "users", rideRequest.driver_email);
      const driverDoc = await getDoc(driverDocRef);
      let newRating = rating;
      let ratingCount = 1;
      if (driverDoc.exists()) {
        const currentRating = parseFloat(driverDoc.data().rating || "0");
        const currentCount = driverDoc.data().ratingCount || 0;
        ratingCount = currentCount + 1;
        newRating = (
          (currentRating * currentCount + rating) /
          ratingCount
        ).toFixed(2);
        await updateDoc(driverDocRef, {
          rating: newRating,
          ratingCount,
        });
      } else {
        await setDoc(driverDocRef, {
          rating: newRating.toString(),
          ratingCount,
          email: rideRequest.driver_email,
          uid: rideRequest.driver_id || "N/A",
        });
      }

      // Prepare ride data
      const rideData = {
        driver: {
          car_gas: rideRequest.driver?.car_details?.fuel_type || "regular",
          car_image_url: rideRequest.driver?.car_details?.image_url || "",
          car_seats: rideRequest.driver?.car_details?.seating_capacity || 5,
          driver_id: rideRequest.driver_id || "N/A",
          first_name: rideRequest.driver?.first_name || "N/A",
          last_name: rideRequest.driver?.last_name || "",
          mpg: rideRequest.driver?.car_details?.mpg || 27,
          rating: newRating.toString(),
        },
        origin: rideRequest.origin || "Unknown",
        destination: rideRequest.destination || "Unknown",
        ride_time,
        uid: rideRequest.driver_id || "N/A",
        rider_email: rideRequest.rider_email || "N/A",
        rider_name: rideRequest.riderName || "N/A",
        status: "completed",
        ...rideRequest,
      };

      // Save ride to rider's rides
      await setDoc(
        doc(db, "users", userDetail.email, "rides", rideRequest.id),
        rideData
      );

      // Save ride to driver's completed_rides
      await setDoc(
        doc(
          db,
          "users",
          rideRequest.driver_email,
          "completed_rides",
          rideRequest.id
        ),
        rideData
      );

      // Delete ride request
      await deleteDoc(doc(db, "ride_requests", rideRequest.id));

      Toast.show({
        type: "success",
        text1: "Ride Completed",
        text2: "Thank you for rating your driver!",
      });
      setRatingModalVisible(false);
      router.replace("/home");
    } catch (error) {
      console.error("Error submitting rating:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit rating.",
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
        ref={mapRef}
        style={styles.map}
        region={region}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
      >
        {rideRequest.status !== "picked_up" && rideRequest.driver_location && (
          <Marker
            coordinate={rideRequest.driver_location}
            title="Driver"
            description={rideRequest.driver?.first_name || "Driver"}
            pinColor="blue"
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
              console.log(
                "Directions result:",
                JSON.stringify(result, null, 2)
              );
            }}
            onError={(error) => {
              console.error(
                "MapViewDirections error:",
                JSON.stringify(error, null, 2)
              );
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
          Driver: {rideRequest.driver?.first_name || "N/A"}{" "}
          {rideRequest.driver?.last_name || ""}
        </Text>
        <Text style={styles.infoText}>From: {rideRequest.origin}</Text>
        <Text style={styles.infoText}>To: {rideRequest.destination}</Text>
        {rideRequest.driver?.car_details?.image_url && !imageError ? (
          <Image
            source={{ uri: rideRequest.driver.car_details.image_url }}
            style={styles.carImage}
            resizeMode="contain"
            onError={handleImageError}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Car Image Available</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.cancelButton, styles.riderCancel]}
        onPress={cancelRide}
      >
        <Text style={styles.cancelButtonText}>Cancel Request</Text>
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={arrivalModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Driver Has Arrived!</Text>
            <Text style={styles.modalText}>
              License Plate:{" "}
              {rideRequest?.driver?.car_details?.license_plate || "N/A"}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, timer > 0 && styles.disabledButton]}
              onPress={() => setArrivalModalVisible(false)}
              disabled={timer > 0}
            >
              <Text style={styles.closeButtonText}>
                OK {timer > 0 ? `(${timer}s)` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={ratingModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Driver</Text>
            <Text style={styles.modalText}>
              How was your ride with {rideRequest?.driver?.first_name || "N/A"}?
            </Text>
            <Rating
              showRating
              type="star"
              fractions={0}
              startingValue={0}
              ratingBackgroundColor="transparent"
              imageSize={30}
              onFinishRating={(value) => setRating(value)}
              style={styles.rating}
            />
            <TouchableOpacity
              style={[styles.submitButton, timer > 0 && styles.disabledButton]}
              onPress={submitRating}
              disabled={timer > 0}
            >
              <Text style={styles.submitButtonText}>
                Submit {timer > 0 ? `(${timer}s)` : ""}
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
  carImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#eb7f05",
    marginTop: 10,
  },
  placeholderImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    backgroundColor: "#0b1e7d",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#eb7f05",
    marginTop: 10,
  },
  placeholderText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
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
  closeButton: {
    backgroundColor: "#f3400d",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  submitButton: {
    backgroundColor: "#f3400d",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  disabledButton: {
    backgroundColor: "#888",
    opacity: 0.6,
  },
  rating: {
    marginBottom: 20,
  },
});
