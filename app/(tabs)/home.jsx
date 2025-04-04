import { Text, View, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import GooglePlacesInput from "../components/GooglePlacesInput";
import RideCard from "../components/RideCard";
const DATA = [
  {
    ride_id: "1",
    destination: "Library West",
    ride_time: 15,
    driver_id: 2,
    user_id: "1",
    driver: {
      driver_id: "2",
      first_name: "Garrett",
      last_name: "Goodkin",
      car_image_url: "https://vexstockimages.fastly.carvana.io/stockimages/2009_TOYOTA_4RUNNER_LIMITED%20SPORT%20UTILITY%204D_BLUE_stock_mobile_640x640.png?v=1673643387.780",
      car_seats: 5,
      car_gas: 'regular',
      mpg: 27,
      rating: "4.60"
    }
  },
  {
    ride_id: "2",
    destination: "Reitz Union Building",
    ride_time: 12,
    driver_id: 2,
    user_id: "1",
    driver: {
      first_name: "John",
      last_name: "Dodd",
      car_image_url: "https://vexstockimages.fastly.carvana.io/stockimages/2011_ACURA_MDX_SPORT%20UTILITY%204D_BURGUNDY_stock_mobile_640x640.png?v=1645498873.832",
      car_seats: 5,
      car_gas: 'premium',
      mpg: 22,
      rating: "4.70"
    }
  },
  {
    ride_id: "3",
    destination: "Flavet Field",
    ride_time: 14,
    driver_id: 2,
    user_id: "1",
    driver: {
      first_name: "Lillian",
      last_name: "Sullivan",
      car_image_url: "https://vexstockimages.fastly.carvana.io/stockimages/2010_TOYOTA_CAMRY_LE%20SEDAN%204D_GRAY_stock_mobile_640x640.png?v=1645506517.460",
      car_seats: 5,
      car_gas: 'regular',
      mpg: 25,
      rating: "4.1"
    }
  },
  {
    ride_id: "4",
    destination: "Southwest Rec Center",
    ride_time: 16,
    driver_id: 2,
    user_id: "1",
    driver: {
      first_name: "Hristo",
      last_name: "Stoynov",
      car_image_url: "https://vexstockimages.fastly.carvana.io/stockimages/2015_Volkswagen_Golf%20GTI_S%20Hatchback%20Sedan%204D_WHITE_stock_mobile_640x640.png",
      car_seats: 5,
      car_gas: 'premium',
      mpg: 21,
      rating: "5.00"
    }
  },
  {
    ride_id: "5",
    destination: "Health Science Library",
    ride_time: 13,
    driver_id: 2,
    user_id: "1",
    driver: {
      first_name: "Brooke",
      last_name: "Albee",
      car_image_url: "https://vexstockimages.fastly.carvana.io/stockimages/2014_Toyota_Corolla_LE%20Sedan%204D_WHITE_stock_mobile_640x640.png",
      car_seats: 5,
      car_gas: 'regular',
      mpg: 24,
      rating: "4.50"
    }
  },
];



export default function Home() {
  const [text, onChangeText] = useState('');
  const [selectedRideId, setSelectedRideId] = useState(null);
  const renderRideCard = ({ item }) => (
    <RideCard
      rideData={item}
      onSelect={() => setSelectedRideId(item.ride_id)}
      isSelected={selectedRideId === item.ride_id}
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
      <Text style={styles.text}>
        Recent Rides
      </Text>
      <FlatList
        data={DATA}
        renderItem={renderRideCard}
        keyExtractor={item => item.ride_id}
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