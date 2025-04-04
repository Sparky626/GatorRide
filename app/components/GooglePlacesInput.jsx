import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { StyleSheet } from 'react-native';
import { setParams } from 'expo-router/build/global-state/routing';
const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      styles={inputBoxStyles}
      placeholder='Where are you going?'
      nearbyPlacesAPI='GooglePlacesSearch'
      debounce={400}
      query={{
        key: 'AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo',
        language: 'en',
        components: 'country:us'
      }}
      fetchDetails={true}
      minLength={2}
      enablePoweredByContainer={false}
    />
  );
};
const inputBoxStyles = StyleSheet.create({
    container: {
        backgroundColor: "#0b1e7d",
        marginTop: 20,
        marginBottom: 20,
        width: "85%",
        flex: 0,
    },
    textInput: {
        fontSize: 18,
        backgroundColor: "#0b1e7d",
        borderWidth: 1,
        color: "white",
        fontFamily: 'oswald-bold',
        borderRadius: 25,
        textAlign: 'center'
    },
    textInputContainer: {
        paddingBottom: 0,
    },
    description: {
        color: "white",
        fontSize: 14,
        fontFamily: 'oswald-bold',
        flexWrap: 'wrap'
    },
    separator:{
        backgroundColor: "#0b1e7d",
    },
    row: {
        backgroundColor: '#0b1e7d',
    }
    
});
export default GooglePlacesInput;