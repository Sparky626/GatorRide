import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
import { useState, useContext, useEffect, useCallback } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";

export default function DriverSchedule() {
  const { userDetail } = useContext(UserDetailContext);
  const [availableRides, setAvailableRides] = useState([]);
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [viewMode, setViewMode] = useState("available");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelRideId, setCancelRideId] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const fetchRides = useCallback(async () => {
    if (!userDetail?.uid || !userDetail?.email) {
      console.log("Missing userDetail:", userDetail);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User details not found. Please sign in again.",
      });
      return;
    }

    try {
      console.log("Fetching available rides...");
      const availableQuery = query(
        collection(db, "scheduled_rides"),
        where("driver_id", "==", "TBD")
      );
      const availableSnapshot = await getDocs(availableQuery);
      const availableData = availableSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Available rides found:", availableData);
      setAvailableRides(availableData);

      console.log("Fetching accepted rides for driver:", userDetail.uid);
      const acceptedQuery = query(
        collection(db, "scheduled_rides"),
        where("driver_id", "==", userDetail.uid)
      );
      const acceptedSnapshot = await getDocs(acceptedQuery);
      const acceptedData = acceptedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Accepted rides found:", acceptedData);
      setAcceptedRides(acceptedData);

      if (availableData.length === 0 && viewMode === "available") {
        Toast.show({
          type: "info",
          text1: "No Rides",
          text2: "No available rides found at this time.",
        });
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load rides. Check your connection.",
      });
    }
  }, [userDetail, viewMode]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  }, [fetchRides]);

  const acceptRide = async () => {
    if (!selectedRide) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No ride selected.",
      });
      return;
    }

    try {
      console.log("Accepting ride:", selectedRide.id);
      const rideId = selectedRide.id;
      const driver = {
        driver_id: userDetail.uid,
        first_name: userDetail.name?.split(" ")[0] || "Driver",
        last_name: userDetail.name?.split(" ").slice(1).join(" ") || "",
        car_image_url:
          userDetail.car_details?.car_image_url ||
          "https://example.com/placeholder.png",
        car_seats: userDetail.car_details?.seats || 5,
        car_gas: userDetail.car_details?.gas_type?.toLowerCase() || "regular",
        mpg: userDetail.car_details?.mpg || 25,
        rating: userDetail.rating || "N/A",
      };

      const rideRef = doc(db, "scheduled_rides", rideId);
      await setDoc(
        rideRef,
        {
          driver_id: userDetail.uid,
          driver,
        },
        { merge: true }
      );

      setAvailableRides(availableRides.filter((r) => r.id !== rideId));
      setAcceptedRides([
        ...acceptedRides,
        { ...selectedRide, driver_id: userDetail.uid, driver },
      ]);
      setModalVisible(false);
      setSelectedRide(null);

      Toast.show({
        type: "success",
        text1: "Ride Accepted",
        text2: "The ride has been added to your schedule.",
      });
      console.log("Ride accepted successfully:", rideId);
    } catch (error) {
      console.error("Error accepting ride:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to accept ride.",
      });
    }
  };

  const cancelAcceptedRide = async () => {
    if (!cancelRideId) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "No ride selected for cancellation.",
      });
      return;
    }

    try {
      const rideRef = doc(db, "scheduled_rides", cancelRideId);
      const cancelledRide = acceptedRides.find(
        (ride) => ride.id === cancelRideId
      );
      await setDoc(
        rideRef,
        {
          driver_id: "TBD",
          driver: {
            driver_id: "TBD",
            first_name: "Pending",
            last_name: "Driver",
            car_details: {
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
            rating: "N/A",
          },
        },
        { merge: true }
      );

      setAcceptedRides(
        acceptedRides.filter((ride) => ride.id !== cancelRideId)
      );
      setAvailableRides([
        ...availableRides,
        {
          ...cancelledRide,
          driver_id: "TBD",
          driver: {
            driver_id: "TBD",
            first_name: "Pending",
            last_name: "Driver",
            car_details: {
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
            rating: "N/A",
          },
        },
      ]);
      setCancelModalVisible(false);
      setCancelRideId(null);

      Toast.show({
        type: "success",
        text1: "Ride Cancelled",
        text2: "You have successfully cancelled this ride.",
      });
    } catch (error) {
      console.error("Error cancelling accepted ride:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to cancel ride.",
      });
    }
  };

  const renderRideItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rideItem}
      onPress={() => {
        if (viewMode === "available") {
          setSelectedRide(item);
          setModalVisible(true);
        }
      }}
      disabled={viewMode === "accepted"}
    >
      <Text style={styles.rideText}>Origin: {item.origin}</Text>
      <Text style={styles.rideText}>Destination: {item.destination}</Text>
      <Text style={styles.rideText}>
        Date: {new Date(item.scheduled_datetime).toLocaleString()}
      </Text>
      <Text style={styles.rideText}>Repeat: {item.repeat}</Text>
      {item.repeat === "Weekly" && item.scheduled_days?.length > 0 && (
        <Text style={styles.rideText}>
          Days: {item.scheduled_days.join(", ")}
        </Text>
      )}
      {viewMode === "accepted" && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setCancelRideId(item.id);
            setCancelModalVisible(true);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {viewMode === "available" ? "Available Rides" : "My Rides"}
      </Text>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() =>
          setViewMode(viewMode === "available" ? "accepted" : "available")
        }
      >
        <Text style={styles.toggleText}>
          {viewMode === "available" ? "View My Rides" : "View Available Rides"}
        </Text>
      </TouchableOpacity>
      <FlatList
        data={viewMode === "available" ? availableRides : acceptedRides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f3400d"
            colors={["#f3400d"]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {viewMode === "available"
              ? "No available rides found."
              : "No accepted rides found."}
          </Text>
        }
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ride Details</Text>
            {selectedRide && (
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                  Rider: {selectedRide.rider_email}
                </Text>
                <Text style={styles.modalText}>
                  From: {selectedRide.origin}
                </Text>
                <Text style={styles.modalText}>
                  To: {selectedRide.destination}
                </Text>
                <Text style={styles.modalText}>
                  Date:{" "}
                  {new Date(selectedRide.scheduled_datetime).toLocaleString()}
                </Text>
                <Text style={styles.modalText}>
                  Repeat: {selectedRide.repeat}
                </Text>
                {selectedRide.repeat === "Weekly" &&
                  selectedRide.scheduled_days?.length > 0 && (
                    <Text style={styles.modalText}>
                      Days: {selectedRide.scheduled_days.join(", ")}
                    </Text>
                  )}
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
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Ride</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this ride?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={cancelAcceptedRide}
              >
                <Text style={styles.modalButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>No, Keep Ride</Text>
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
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "oswald-bold",
    textAlign: "center",
    marginBottom: 20,
  },
  toggleButton: {
    backgroundColor: "#f3400d",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  toggleText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
  },
  rideItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  rideText: {
    color: "#0b1e7d",
    fontFamily: "oswald-bold",
    fontSize: 14,
    marginBottom: 5,
  },
  cancelButton: {
    backgroundColor: "#888",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#1a2a9b",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: "#eb7f05",
    fontFamily: "oswald-bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 15,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: "#f3400d",
  },
  confirmButton: {
    backgroundColor: "#f3400d",
  },
  cancelModalButton: {
    backgroundColor: "#888",
  },
  modalButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
  },
  emptyText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
