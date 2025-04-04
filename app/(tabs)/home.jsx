import { Text, View, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import GooglePlacesInput from "../components/GooglePlacesInput";
import RideCard from "../components/RideCard";
export default function Home() {
  const {userDetail, setUserDetail} = useContext(UserDetailContext);
  const [rides, setRides] = useState([]);
  const [selectedRideId, setSelectedRideId] = useState(null);
  useEffect(() => {
    const fetchRides = async () => {
      try {
        const user = userDetail?.email;
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
  }, []);
  const renderRideCard = ({ item }) => (
    <RideCard
      rideData={item}
      onSelect={() => setSelectedRideId(item.id)}
      isSelected={selectedRideId === item.id}
    />
  );
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')}
      style={{
        width: 200,
        height: 100,
        marginTop: 70
      }}
      />
      <GooglePlacesInput/>
      <Text style={styles.text}>Recent Rides</Text>
      <FlatList
        data={rides}
        renderItem={renderRideCard}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1e7d',
    alignItems: 'center',
    fontFamily: 'oswald-light'
  },
  text:{
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'oswald-bold',
    color: 'white'
  },
  textinput: {
    textAlign: 'center',
    height: 70,
    width: 360,
    borderWidth: 2,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 25,
    fontSize: 27.5,
    backgroundColor: '#0b1e7d',
    fontFamily: 'oswald-bold'
  }
});