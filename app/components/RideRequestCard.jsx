import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";

const RideRequestCard = ({ requestData, onSelect, isSelected }) => {
  const { riderName, origin, destination, createdAt } = requestData;

  // Format creation time (e.g., "10 min ago")
  const formatTimeAgo = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.round((now - created) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.round(diffInMinutes / 60);
    return `${diffInHours} hr ago`;
  };

  return (
    <TouchableOpacity
      style={[styles.cardContainer, isSelected && styles.selectedCard]}
      onPress={onSelect}
    >
      <View style={styles.requestInfo}>
        <View>
          <Text style={styles.riderEmail}>{riderName}</Text>
          <Text style={styles.origin}>From {origin}</Text>
          <Text style={styles.origin}>To {destination}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(createdAt)}</Text>
        </View>
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
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIcon: {
    width: 70,
    height: 70,
    marginRight: 12.5,
  },
  riderEmail: {
    fontFamily: 'oswald-bold',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  origin: {
    fontFamily: 'oswald-bold',
    fontSize: 14,
    color: 'grey',
  },
  timeAgo: {
    fontFamily: 'oswald-bold',
    fontSize: 12,
    color: '#666',
  },
});

export default RideRequestCard;