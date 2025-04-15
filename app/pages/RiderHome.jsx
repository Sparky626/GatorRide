import { Text, View, StyleSheet, FlatList, Image } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import GooglePlacesInput from "../components/GooglePlacesInput";
import RideCard from "../components/RideCard";

export default function RiderHome() {
  const { userDetail } = useContext(UserDetailContext);
  const [rides, setRides] = useState([]);
  const [origin, setOrigin] = useState("");
  const [selectedRideId, setSelectedRideId] = useState(null);

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
          onPlaceSelected={(description) => setOrigin(description)}
          value={origin}
          placeholder="Where are you headed?"
        />
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
    backgroundColor: '#0b1e7d',
    paddingTop: 50,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 90,
    marginVertical: 20,
  },
  searchContainer: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: '#1a2a9b',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ridesContainer: {
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