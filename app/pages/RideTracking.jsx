import React, { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { UserDetailContext } from "@/context/UserDetailContext";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function RideTracking() {
  const { userDetail } = useContext(UserDetailContext);
  const { requestId } = useLocalSearchParams();
  const router = useRouter();
  const [rideRequest, setRideRequest] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!requestId || !userDetail?.uid) return;

    // Fetch ride request
    const unsubscribe = onSnapshot(doc(db, "ride_requests", requestId), (doc) => {
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
    }, (error) => {
      console.error("Error fetching ride request:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load ride request.",
      });
    });

    // Update user location
    const updateLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required.");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });

        // Update Firestore with user's location
        const locationField = userDetail.isDriver ? "driver_location" : "rider_location";
        await updateDoc(doc(db, "ride_requests", requestId), {
          [locationField]: { latitude, longitude },
        });
      } catch (error) {
        console.error("Error updating location:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to update location.",
        });
      }
    };

    updateLocation();
    const interval = setInterval(updateLocation, 30000); // Update every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [requestId, userDetail]);

  const cancelRide = async () => {
    if (!rideRequest) return;

    try {
      if (userDetail.isDriver) {
        // Driver resets to pending
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
        // Rider deletes the request
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
  };

  if (!rideRequest || !userLocation) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  const riderLocation = rideRequest.rider_location || {
    latitude: parseFloat(rideRequest.origin.split(",")[0]) || 29.6516,
    longitude: parseFloat(rideRequest.origin.split(",")[1]) || -82.3248,
  };
  const driverLocation = rideRequest.driver_location || userLocation;

  const region = {
    latitude: riderLocation.latitude,
    longitude: riderLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} provider={PROVIDER_DEFAULT}>
        <Marker
          coordinate={riderLocation}
          title="Rider"
          description={rideRequest.riderName}
          pinColor="red"
        />
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description={rideRequest.driver?.first_name || "Driver"}
            pinColor="blue"
          />
        )}
      </MapView>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {userDetail.isDriver
            ? `Rider: ${rideRequest.riderName}`
            : `Driver: ${rideRequest.driver.first_name} ${rideRequest.driver.last_name}`}
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
  },
  map: {
    flex: 1,
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
    marginTop: 20,
  },
});