import { Text, View, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, ActivityIndicator } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, getDocs, addDoc, deleteDoc, onSnapshot, doc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import GooglePlacesInput from "../components/GooglePlacesInput";
import RideCard from "../components/RideCard";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import { useRouter } from "expo-router";

export default function RiderHome() {
  const { userDetail } = useContext(UserDetailContext);
  const router = useRouter();
  const [rides, setRides] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [modalRequestId, setModalRequestId] = useState(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to set your current position as the ride origin."
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;

        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const { street, city, region, country } = geocode[0];
          const address = `${street || ""}, ${city || ""}, ${region || ""}, ${country || ""}`
            .replace(/, ,/g, ",")
            .replace(/,,/g, ",")
            .trim();
          setOrigin(address);
        } else {
          setOrigin(`${latitude}, ${longitude}`);
        }
      } catch (error) {
        console.error("Error fetching current location:", error);
        Alert.alert("Error", "Failed to fetch current location.");
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (!userDetail?.uid || !userDetail?.email) {
      console.log("Missing userDetail.uid or userDetail.email");
      return;
    }

    const fetchRides = async () => {
      try {
        const ridesRef = collection(db, "users", userDetail.email, "rides");
        const querySnapshot = await getDocs(ridesRef);
        const ridesData = [];
        querySnapshot.forEach((doc) => {
          ridesData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setRides(ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
      }
    };

    const fetchRideRequests = () => {
      const requestsRef = collection(db, "ride_requests");
      const unsubscribe = onSnapshot(requestsRef, (querySnapshot) => {
        const requestsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.user_id === userDetail.uid && (data.status === "pending" || data.status === "accepted" || data.status === "picked_up" || data.status === "dropped_off")) {
            requestsData.push({
              id: doc.id,
              ...data,
            });
          }
        });
        console.log("Ride requests updated:", JSON.stringify(requestsData, null, 2));
        setRideRequests(requestsData);
        if (requestsData.length > 0 && requestsData[0].status === "pending" && requestsData[0].id !== modalRequestId) {
          setSearchModalVisible(true);
          setModalRequestId(requestsData[0].id);
        } else if (requestsData.length === 0 || requestsData[0].status !== "pending") {
          setSearchModalVisible(false);
          setModalRequestId(null);
        }
        if (
          requestsData.length > 0 &&
          (requestsData[0].status === "accepted" || requestsData[0].status === "picked_up" || requestsData[0].status === "dropped_off") &&
          requestsData[0].driver_email
        ) {
          setSearchModalVisible(false);
          setModalRequestId(null);
          router.push(`pages/RiderTracking?requestId=${requestsData[0].id}`);
        }
      }, (error) => {
        console.error("Error fetching ride requests:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load ride requests.",
        });
      });

      return unsubscribe;
    };

    fetchRides();
    const unsubscribe = fetchRideRequests();
    return () => unsubscribe && unsubscribe();
  }, [userDetail?.uid, userDetail?.email, router]);

  const submitRideRequest = async () => {
    if (!origin || !userDetail?.email || !userDetail?.uid) {
      Alert.alert("Error", "Please select a location and ensure you are logged in.");
      return;
    }

    if (isSubmitting) {
      console.log("Submit ignored: already submitting");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      const hasActiveRequest = rideRequests.some(
        (req) => req.status === "pending" || req.status === "accepted" || req.status === "picked_up" || req.status === "dropped_off"
      );
      if (hasActiveRequest) {
        Alert.alert(
          "Active Request Exists",
          "You can only have one active ride request at a time. Please cancel your current request before submitting a new one."
        );
        return;
      }

      console.log("Submitting ride request:", { origin, destination });
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      const rideRequest = {
        riderName: userDetail.name || "Rider",
        origin,
        destination,
        status: "pending",
        createdAt: new Date().toISOString(),
        user_id: userDetail.uid,
        rider_email: userDetail.email,
        rider_location: { latitude, longitude },
      };

      const docRef = await addDoc(collection(db, "ride_requests"), rideRequest);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Ride request submitted successfully!",
      });
      setDestination("");
    } catch (error) {
      console.error("Error submitting ride request:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to submit ride request.",
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const cancelRideRequest = async (requestId) => {
    if (!requestId) {
      console.error("Invalid requestId for cancellation");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid ride request ID.",
      });
      return;
    }

    try {
      console.log("Cancelling ride request:", requestId);
      await deleteDoc(doc(db, "ride_requests", requestId));
      setRideRequests([]);
      setSearchModalVisible(false);
      setModalRequestId(null);
      Toast.show({
        type: "success",
        text1: "Ride Request Cancelled",
        text2: "Your ride request has been successfully cancelled.",
      });
    } catch (error) {
      console.error("Error cancelling ride request:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to cancel ride request.",
      });
    }
  };

  const renderRideCard = ({ item }) => (
    <RideCard
      rideData={{
        ...item,
        status: item.status || "completed",
      }}
      onSelect={() => setSelectedRideId(item.id)}
      isSelected={selectedRideId === item.id}
    />
  );

  const hasActiveRequest = rideRequests.some(
    (req) => req.status === "pending" || req.status === "accepted" || req.status === "picked_up" || req.status === "dropped_off"
  );

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <View style={styles.searchContainer}>
        <GooglePlacesInput
          onPlaceSelected={(description) => setDestination(description)}
          value={destination}
          placeholder="Where are you headed?"
        />
        <TouchableOpacity
          style={[styles.submitButton, (loading || hasActiveRequest || isSubmitting) && styles.disabledButton]}
          onPress={submitRideRequest}
          disabled={loading || hasActiveRequest || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {loading ? "Submitting..." : "Submit Ride Request"}
          </Text>
        </TouchableOpacity>
        {hasActiveRequest && (
          <Text style={styles.disabledText}>
            Only one active ride request allowed at a time.
          </Text>
        )}
      </View>
      <View style={styles.ridesContainer}>
        <Text style={styles.sectionTitle}>Completed Rides</Text>
        <FlatList
          data={rides}
          renderItem={renderRideCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No completed rides found.</Text>
          }
        />
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={searchModalVisible}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Searching for Driver</Text>
            <ActivityIndicator size="large" color="#f3400d" style={styles.loader} />
            <Text style={styles.modalText}>
              Please wait while we find a driver for your ride.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => rideRequests[0] && cancelRideRequest(rideRequests[0].id)}
              >
                <Text style={styles.modalButtonText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
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
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 90,
    marginBottom: 5,
  },
  searchContainer: {
    width: "90%",
    alignItems: "center",
    backgroundColor: "#1a2a9b",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ridesContainer: {
    flex: 1,
    alignItems: "center",
    width: "90%",
    backgroundColor: "#1a2a9b",
    borderRadius: 15,
    padding: 12.5,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    color: "white",
    fontFamily: "oswald-bold",
    fontSize: 24,
    marginBottom: 15,
    textAlign: "center",
  },
  emptyText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#f3400d",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    width: "90%",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "oswald-bold",
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
  },
  disabledButton: {
    backgroundColor: "#a0a0a0",
    opacity: 0.6,
  },
  disabledText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#1a2a9b',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: '#eb7f05',
    fontFamily: 'oswald-bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  modalButtonText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 16,
  },
  loader: {
    marginBottom: 10,
  },
});