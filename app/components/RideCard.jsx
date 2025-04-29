import React, { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from "react-native";

const RideCard = ({ rideData, onSelect, isSelected }) => {
  const { 
    ride_time,
    driver,
    destination,
    origin,
    rider_name,
    createdAt,
    rider_email,
    status,
    uid,
  } = rideData;
  const distance = ((ride_time / 60) * 55).toFixed(1);
  const gaspermile = (driver.car_gas === 'premium') ? 3.87/driver.mpg : 3.16/driver.mpg;
  const totalprice = distance * gaspermile;
  var eta = (ride_time >= 60) ? Math.round(ride_time / 60) : ride_time;
  var time = (ride_time >= 60) ? "hr" : "min";
  const [modalVisible, setModalVisible] = useState(false);
  
  // Truncate text to prevent overflow
  const truncateText = (text, maxLength) => {
    if (!text) return "Unknown";
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
  };

  // Format ride date from createdAt
  const rideDate = createdAt ? new Date(createdAt).toLocaleDateString() : "N/A";

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.cardContainer,
          isSelected && styles.selectedCard
        ]}
        onPress={() => {
          setModalVisible(true);
          onSelect();
        }}
      >
        <View style={styles.rideInfo}>
          <Image
            resizeMode="contain"
            source={{ uri: driver.car_details?.image_url || "https://via.placeholder.com/70" }}
            style={styles.rideIcon}
          />
          <View>
            <Text style={styles.rideType}>{driver.first_name || "N/A"} {driver.last_name || ""}</Text>
            <Text style={styles.destination}>to {truncateText(destination, 25)}</Text>
            <Text style={styles.originText}>from {truncateText(origin, 25)}</Text>
            <Text style={styles.rating}>★{parseFloat(driver.rating || 0).toFixed(1)}</Text>
            <Text style={styles.rideDate}>Date: {rideDate}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.timeDistance}>
            <Text style={styles.eta}>{eta} {time}</Text>
            <Text style={styles.distance}>{distance} miles</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Ride Details</Text>
            <Image
              resizeMode="contain"
              source={{ uri: driver.car_details?.image_url || "https://via.placeholder.com/150" }}
              style={styles.modalImage}
            />
            <Text style={styles.modalText}>Driver: {driver.first_name || "N/A"} {driver.last_name || ""}</Text>
            <Text style={styles.modalText}>Driver Rating: ★{parseFloat(driver.rating || 0).toFixed(1)}</Text>
            <Text style={styles.modalText}>From: {origin}</Text>
            <Text style={styles.modalText}>To: {destination}</Text>
            <Text style={styles.modalText}>Ride Date: {rideDate}</Text>
            <Text style={styles.modalText}>Ride Time: {eta} {time}</Text>
            <Text style={styles.modalText}>Distance: {distance} miles</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
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
    fontFamily: 'oswald-bold',
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
    color: '#000',
  },
  destination: {
    fontFamily: 'oswald-bold',
    fontSize: 14,
    color: 'grey',
  },
  originText: {
    fontFamily: 'oswald-bold',
    fontSize: 14,
    color: 'grey',
  },
  rating: {
    fontSize: 12,
    color: '#ffce33',
    fontFamily: 'oswald-bold',
  },
  rideDate: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'oswald-bold',
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
    fontFamily: 'oswald-bold',
  },
  distance: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'oswald-bold',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'oswald-bold',
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    marginTop: 150,
    backgroundColor: '#1a2a9b',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#eb7f05',
    fontFamily: 'oswald-bold',
    fontSize: 20,
    marginBottom: 15,
  },
  modalText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  modalImage: {
    alignItems: 'center',
    width: 250,
    height: 150,
    marginBottom: 15,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: '#eb7f05',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
});

export default RideCard;