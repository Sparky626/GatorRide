import { Text, View, StyleSheet, FlatList, Image } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import RideRequestCard from "../components/RideCard";

export default function DriverHome() {
  const { userDetail } = useContext(UserDetailContext);
  const [rideRequests, setRideRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    const fetchRideRequests = async () => {
      try {
        const requestsRef = collection(db, "ride_requests");
        const querySnapshot = await getDocs(requestsRef);
        const requestsData = [];
        querySnapshot.forEach((doc) => {
          requestsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setRideRequests(requestsData);
      } catch (error) {
        console.error("Error fetching ride requests:", error);
      }
    };
    fetchRideRequests();
  }, []);

  const renderRideRequestCard = ({ item }) => (
    <RideRequestCard
      requestData={item}
      onSelect={() => setSelectedRequestId(item.id)}
      isSelected={selectedRequestId === item.id}
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
          data={rideRequests}
          renderItem={renderRideRequestCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No ride requests available.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1e7d',
    paddingTop: 50,
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
});