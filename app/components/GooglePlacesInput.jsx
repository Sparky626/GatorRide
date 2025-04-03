import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { StyleSheet } from 'react-native';
const GooglePlacesInput = () => {
  return (
    <GooglePlacesAutocomplete
      styles={inputBoxStyles}
      placeholder='Where are you going?'
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        key: 'AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo',
        language: 'en',
      }}
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
    },
    textInputContainer: {
        paddingBottom: 0,
    },
});
export default GooglePlacesInput;