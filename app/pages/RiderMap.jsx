import { Text, View, StyleSheet } from "react-native";
import MapView from "react-native-maps";

const INITIAL_REGION = {
  latitude: 29.647011,
  longitude: -82.347389,
  latitudeDelta: 0.0175,
  longitudeDelta: 0.0175,
};

export default function RiderMap() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        followsUserLocation={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "100%",
    color: "#eb7f05",
  },
});
