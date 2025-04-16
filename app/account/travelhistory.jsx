import { Text, View, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import RideCard from "../components/RideCard";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";

export default function TravelHistory() {
  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);
  const [rides, setRides] = useState([]);
  const [selectedRideId, setSelectedRideId] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const user = userDetail?.email;
        if (!user) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "User not found. Please sign in again.",
          });
          return;
        }
        const ridesRef = collection(db, "users", user, "rides");
        const querySnapshot = await getDocs(ridesRef);
        const ridesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRides(ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load travel history.",
        });
      }
    };
    fetchRides();
  }, [userDetail]);

  const renderRideCard = ({ item }) => (
    <RideCard
      rideData={item}
      onSelect={() => setSelectedRideId(item.id)}
      isSelected={selectedRideId === item.id}
    />
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/profile")}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>BACK</Text>
      </TouchableOpacity>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Travel History</Text>
      </View>
      <View style={styles.ridesContainer}>
        <FlatList
          data={rides}
          renderItem={renderRideCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No travel history found.</Text>
          }
        />
      </View>
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
  backButton: {
    alignSelf: "flex-start",
    marginTop: (Platform.OS === 'ios') ? 40 : 0,
    marginBottom: 20,
  },
  backButtonText: {
    color: "#f3400d",
    fontFamily: "oswald-bold",
    fontSize: 22,
    textTransform: "uppercase",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 30,
    textAlign: "center",
  },
  ridesContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#1a2a9b",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
});