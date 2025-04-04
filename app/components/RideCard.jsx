import React from "react";
import { Text, View, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from "react-native";

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

const styles = StyleSheet.create({
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
})

export default RideCard;