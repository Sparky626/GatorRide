import { Text, View, StyleSheet, FlatList, Image, Modal, TouchableOpacity } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import RideRequestCard from "../components/RideRequestCard";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import { useRouter } from "expo-router";

export default function DriverHome() {
  const { userDetail } = useContext(UserDetailContext);
  const router = useRouter();
  const [rideRequests, setRideRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const requestsRef = collection(db, "ride_requests");
    const unsubscribe = onSnapshot(requestsRef, (querySnapshot) => {
      const requestsData = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setRideRequests(requestsData);
    }, (error) => {
      console.error("Error fetching ride requests:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load ride requests.",
      });
    });

    return () => unsubscribe();
  }, []);

  const acceptRide = async () => {
    if (!selectedRequest || !userDetail?.uid || !userDetail?.email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User or ride details not found.",
      });
      return;
    }

    try {
      const rideId = selectedRequest.id;
      const driver = {
        driver_id: userDetail.uid,
        first_name: userDetail.name?.split(" ")[0] || "Driver",
        last_name: userDetail.name?.split(" ").slice(1).join(" ") || "",
        car_details: userDetail.car_details || {
          car_image_url: "https://example.com/placeholder.png",
          seats: 5,
          gas_type: "regular",
          mpg: 25,
          license_plate: "TBD",
          capacity: 5,
          color: "Unknown",
          make: "Unknown",
          model: "Unknown",
          year: 0,
        },
        rating: userDetail.rating || "N/A",
      };

      // Update the ride request in ride_requests
      await updateDoc(doc(db, "ride_requests", rideId), {
        status: "accepted",
        driver_id: userDetail.uid,
        driver,
      });

      setModalVisible(false);
      setSelectedRequest(null);
      Toast.show({
        type: "success",
        text1: "Ride Accepted",
        text2: "You have accepted the ride request.",
      });

      // Navigate to DriverTracking
      router.push(`pages/DriverTracking?requestId=${rideId}`);
    } catch (error) {
      console.error("Error accepting ride:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to accept ride.",
      });
    }
  };

  const renderRideRequestCard = ({ item }) => (
    <RideRequestCard
      requestData={item}
      onSelect={() => {
        setSelectedRequest(item);
        setModalVisible(true);
      }}
      isSelected={selectedRequest?.id === item.id}
    />
  );

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <View style={styles.requestsContainer}>
        <Text style={styles.sectionTitle}>Available Ride Requests</Text>
        <FlatList
          data={rideRequests.filter((r) => r.status === "pending")}
          renderItem={renderRideRequestCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No ride requests available.</Text>
          }
        />
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ride Request Details</Text>
            {selectedRequest && (
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                  Rider: {selectedRequest.riderName}
                </Text>
                <Text style={styles.modalText}>
                  From: {selectedRequest.origin}
                </Text>
                <Text style={styles.modalText}>
                  To: {selectedRequest.destination}
                </Text>
                <Text style={styles.modalText}>
                  Requested: {new Date(selectedRequest.createdAt).toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={acceptRide}
              >
                <Text style={styles.modalButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
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
    backgroundColor: '#0b1e7d',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 90,
    marginVertical: 20,
  },
  requestsContainer: {
    flex: 1,
    alignItems: 'center',
    width: '90%',
    backgroundColor: '#1a2a9b',
    borderRadius: 15,
    padding: 12.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    color: 'white',
    fontFamily: 'oswald-bold',
    fontSize: 24,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
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
  modalContent: {
    marginBottom: 20,
  },
  modalText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 16,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#f3400d',
  },
  cancelButton: {
    backgroundColor: '#888',
  },
  modalButtonText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 16,
  },
});