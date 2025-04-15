import { Text, View, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useState, useContext, useEffect, useCallback } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";

export default function DriverSchedule() {
  const { userDetail } = useContext(UserDetailContext);
  const [availableRides, setAvailableRides] = useState([]);
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [viewMode, setViewMode] = useState("available");
  const [refreshing, setRefreshing] = useState(false);

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
      // Fetch available rides
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

      // Fetch accepted rides
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

  // Initial fetch
  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  }, [fetchRides]);

  const acceptRide = async (ride) => {
    try {
      console.log("Accepting ride:", ride.id);
      const rideId = ride.id;
      const driver = {
        driver_id: userDetail.uid,
        first_name: userDetail.name?.split(" ")[0] || "Driver",
        last_name: userDetail.name?.split(" ").slice(1).join(" ") || "",
        car_image_url: userDetail.car_details?.car_image_url || "https://example.com/placeholder.png",
        car_seats: userDetail.car_details?.seats || 5,
        car_gas: userDetail.car_details?.gas_type?.toLowerCase() || "regular",
        mpg: userDetail.car_details?.mpg || 25,
        rating: userDetail.rating || "N/A",
      };

      // Update the ride in the scheduled_rides collection
      const rideRef = doc(db, "scheduled_rides", rideId);
      await setDoc(
        rideRef,
        {
          driver_id: userDetail.uid,
          driver,
        },
        { merge: true }
      );

      // Update local state
      setAvailableRides(availableRides.filter((r) => r.id !== rideId));
      setAcceptedRides([...acceptedRides, { ...ride, driver_id: userDetail.uid, driver }]);

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

  const renderRideItem = ({ item }) => (
    <View style={styles.rideItem}>
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
      {viewMode === "available" && (
        <TouchableOpacity style={styles.acceptButton} onPress={() => acceptRide(item)}>
          <Text style={styles.acceptButtonText}>Accept Ride</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {viewMode === "available" ? "Available Rides" : "My Rides"}
      </Text>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setViewMode(viewMode === "available" ? "accepted" : "available")}
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
            {viewMode === "available" ? "No available rides found." : "No accepted rides found."}
          </Text>
        }
      />
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
  acceptButton: {
    backgroundColor: "#f3400d",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  acceptButtonText: {
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