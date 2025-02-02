import { Text, View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

const INITIAL_REGION = {
    latitude: 29.651634, 
    longitude: -82.324829,
    latitudeDelta: 0.10,
    longitudeDelta: 0.10,
}

export default function Map() {
    return (
        <View  style = {styles.container}>
            <MapView 
            style={styles.map}
            initialRegion={INITIAL_REGION}
            />
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
        color: '#eb7f05'
    },
});