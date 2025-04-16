import { Text, View, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import GooglePlacesInput from "../components/GooglePlacesInput";
import RideCard from "../components/RideCard";
import * as Location from "expo-location"; // Added expo-location

export default function RiderHome() {
  const { userDetail } = useContext(UserDetailContext);
  const [rides, setRides] = useState([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [loading, setLoading] = useState(false); // Added for loading state

  // Fetch user's current location and set origin
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to set your current position as the ride origin."
          );
          return;
        }

        // Get current position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = location.coords;

        // Reverse geocode to get address
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const { street, city, region, country } = geocode[0];
          const address = `${street || ""}, ${city || ""}, ${region || ""}, ${country || ""}`
            .replace(/, ,/g, ",")
            .replace(/,,/g, ",")
            .trim();
          setOrigin(address);
        } else {
          // Fallback to coordinates if reverse geocoding fails
          setOrigin(`${latitude}, ${longitude}`);
        }
      } catch (error) {
        console.error("Error fetching current location:", error);
        Alert.alert("Error", "Failed to fetch current location.");
      }
    };

    getCurrentLocation();
  }, []);

  // Fetch user's rides
  useEffect(() => {
    const fetchRides = async () => {
      try {
        const user = userDetail?.email;
        if (!user) return;
        const ridesRef = collection(db, "users", user, "rides");
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
    fetchRides();
  }, [userDetail]);

  // Function to submit a ride request
  const submitRideRequest = async () => {
    if (!origin || !userDetail?.email) {
      Alert.alert("Error", "Please select a location and ensure you are logged in.");
      return;
    }

    setLoading(true);
    try {
      const rideRequest = {
        riderName: userDetail.name,
        origin,
        destination,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Add to global ride_requests collection
      await addDoc(collection(db, "ride_requests"), rideRequest);
      Alert.alert("Success", "Ride request submitted successfully!");
      setDestination(""); // Clear the input
      // Refresh rides
      const ridesRef = collection(db, "users", userDetail.email, "rides");
      const querySnapshot = await getDocs(ridesRef);
      const ridesData = [];
      querySnapshot.forEach((doc) => {
        ridesData.push({ id: doc.id, ...doc.data() });
      });
      setRides(ridesData);
    } catch (error) {
      console.error("Error submitting ride request:", error);
      Alert.alert("Error", "Failed to submit ride request.");
    } finally {
      setLoading(false);
    }
  };

  const renderRideCard = ({ item }) => (
    <RideCard
      rideData={item}
      onSelect={() => setSelectedRideId(item.id)}
      isSelected={selectedRideId === item.id}
    />
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
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitRideRequest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Submitting..." : "Submit Ride Request"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.ridesContainer}>
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        <FlatList
          data={rides}
          renderItem={renderRideCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recent rides found.</Text>
          }
        />
      </View>
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
    marginVertical: 20,
  },
  searchContainer: {
    width: "90%",
    alignItems: "center",
    backgroundColor: "#1a2a9b",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
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
});