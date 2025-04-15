import { Text, View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useState, useEffect, useContext } from 'react';
import { UserDetailContext } from '@/context/UserDetailContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const INITIAL_REGION = {
  latitude: 29.647011,
  longitude: -82.347389,
  latitudeDelta: 0.0175,
  longitudeDelta: 0.0175,
};

export default function DriverMap() {
  const { userDetail } = useContext(UserDetailContext);
  const [rideRequests, setRideRequests] = useState([]);

  useEffect(() => {
    const fetchRideRequests = async () => {
      try {
        const requestsRef = collection(db, "ride_requests");
        const querySnapshot = await getDocs(requestsRef);
        const requestsData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((request) => request.origin?.latitude && request.origin?.longitude);
        setRideRequests(requestsData);
      } catch (error) {
        console.error("Error fetching ride requests:", error);
      }
    };
    fetchRideRequests();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {rideRequests.map((request) => (
          <Marker
            key={request.id}
            coordinate={{
              latitude: request.origin.latitude,
              longitude: request.origin.longitude,
            }}
            title={request.origin.description}
            description={`Ride Request #${request.id}`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1e7d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
    color: '#eb7f05',
  },
});