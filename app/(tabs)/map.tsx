import React, { useEffect, useRef } from 'react';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { markers } from '../assets/markers';

const INITIAL_REGION = {
	latitude: 29.6465,
	longitude: -82.3533,
	latitudeDelta: 0.10,
	longitudeDelta: 0.10
};

export default function Map() {
	const mapRef = useRef<any>(null);
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity onPress={focusMap}>
					<View style={{ padding: 10 }}>
						<Text>Focus</Text>
					</View>
				</TouchableOpacity>
			)
		});
	}, []);

	const focusMap = () => {
		const GreenBayStadium = {
			latitude: 44.5013,
			longitude: -88.0622,
			latitudeDelta: 0.1,
			longitudeDelta: 0.1
		};

		mapRef.current?.animateToRegion(GreenBayStadium);
		// mapRef.current?.animateCamera({ center: GreenBayStadium, zoom: 10 }, { duration: 2000 });
	};

	const onMarkerSelected = (marker: any) => {
		Alert.alert(marker.name);
	};

	const calloutPressed = (ev: any) => {
		console.log(ev);
	};

	const onRegionChange = (region: Region) => {
		console.log(region);
	};

	return (
		<View style={{ flex: 1 }}>
			<MapView
				style={StyleSheet.absoluteFillObject}
				initialRegion={INITIAL_REGION}
				showsUserLocation
				showsMyLocationButton
				ref={mapRef}
				onRegionChangeComplete={onRegionChange}
			>
				{markers.map((marker, index) => (
					<Marker
						key={index}
						title={marker.name}
						coordinate={marker}
						onPress={() => onMarkerSelected(marker)}
					>
						<Callout onPress={calloutPressed}>
							<View style={{ padding: 10 }}>
								<Text style={{ fontSize: 24 }}>Hello</Text>
							</View>
						</Callout>
					</Marker>
				))}
			</MapView>
		</View>
	);
}