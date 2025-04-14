import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { setParams } from 'expo-router/build/global-state/routing';
const GooglePlacesInput = ({ placeholder = 'Where are you going?', onPlaceSelected, value = ''}) => {
  const [selectedDescription, setSelectedDescription] = useState('');
  return (
    <GooglePlacesAutocomplete
      styles={inputBoxStyles}
      placeholder={placeholder}
      nearbyPlacesAPI='GooglePlacesSearch'
      debounce={400}
      onPress={(data, details = null) => {
        const description = data.description;
        setSelectedDescription(description);
        if (onPlaceSelected) {
          onPlaceSelected(description);
        }
      }}
      query={{
        key: 'AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo',
        language: 'en',
        components: 'country:us'
      }}
      fetchDetails={true}
      minLength={2}
      enablePoweredByContainer={false}
      textInputProps={{
        value: value, // Set the input text to the value prop
        onChangeText: (text) => {
          if (onPlaceSelected) {
            onPlaceSelected(text); // Update the parent state when typing manually
          }
        },
      }}
    />
  );
};
const inputBoxStyles = StyleSheet.create({
    container: {
        backgroundColor: "#1a2a9b",
        alignItems: 'center',
        width: "100%",
        flex: 0,
    },
    textInput: {
        fontSize: 20,
        backgroundColor: "#1a2a9b",
        borderColor: '#1a2a9b',
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
        backgroundColor: "#1a2a9b",
    },
    row: {
        backgroundColor: '#1a2a9b',
    }
    
});
export default GooglePlacesInput;