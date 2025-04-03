import { Text, View, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import GooglePlacesInput from "../components/GooglePlacesInput";
const DATA = [
  {
    ride_id: "1",
    destination: "Library West",
    ride_time: 15,
    fare_price: "16.00",
    payment_status: "paid",
    driver_id: 2,
    user_id: "1",
    created_at: "2024-08-12 05:19:20.620007",
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
    payment_status: "paid",
    driver_id: 2,
    user_id: "1",
    created_at: "2024-08-12 05:19:20.620007",
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
    payment_status: "paid",
    driver_id: 2,
    user_id: "1",
    created_at: "2024-08-12 05:19:20.620007",
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
    payment_status: "paid",
    driver_id: 2,
    user_id: "1",
    created_at: "2024-08-12 05:19:20.620007",
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
    payment_status: "paid",
    driver_id: 2,
    user_id: "1",
    created_at: "2024-08-12 05:19:20.620007",
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

const RideCard = ({ rideData, onSelect, isSelected }) => {
  const { 
    ride_time,
    driver,
    destination 
  } = rideData;
  const distance = ((ride_time / 60) * 55).toFixed(1);
  const gaspermile = (driver.gas = 'premium') ? 3.87/driver.mpg:3.16/driver.mpg;
  const totalprice = distance * gaspermile;
  var eta = (ride_time >= 60) ? Math.round(ride_time / 60):ride_time;
  var time = (ride_time >= 60) ? "hr":"min";
  return (
    <TouchableOpacity 
      style={[
        styles.cardContainer,
        isSelected && styles.selectedCard
      ]}
      onPress={onSelect}
    >
      <View style={styles.rideInfo}>
        <Image
          source={{ uri: driver.car_image_url }}
          style={styles.rideIcon}
        />
        <View>
          <Text style={styles.rideType}>{driver.first_name} {driver.last_name}</Text>
          <Text style={styles.destination}>
            to {destination}
          </Text>
          <Text style={styles.rating}>★{parseFloat(driver.rating).toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.timeDistance}>
          <Text style={styles.eta}>{eta} {time}</Text>
          <Text style={styles.distance}>{distance} miles</Text>
        </View>
        <Text style={styles.price}>${parseFloat(totalprice).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
};

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
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 5,
    width: 360,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: 'orange',
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideIcon: {
    width: 70,
    height: 70,
    marginRight: 12.5,
  },
  rideType: {
    fontFamily: 'oswald-bold',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  destination: {
    fontFamily: 'oswald-bold',
    fontSize: 14,
    color: 'grey',
  },
  rating: {
    fontSize: 12,
    color: '#ffce33',
    fontFamily: 'oswald-bold'
  },
  detailsContainer: {
    alignItems: 'flex-end',
  },
  timeDistance: {
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  eta: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'oswald-bold'
  },
  distance: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'oswald-bold'
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'oswald-bold',
    color: '#000'
  },
});