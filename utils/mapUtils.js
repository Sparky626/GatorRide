import { debounce } from "lodash";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// Debounced Firestore update function
export const updateFirestoreLocation = debounce(async (location, locationField, requestId) => {
  try {
    await updateDoc(doc(db, "ride_requests", requestId), {
      [locationField]: location,
    });
  } catch (error) {
    console.error("Error updating Firestore location:", error);
  }
}, 1000);

// Geocode address to coordinates
export const geocodeAddress = async (address) => {
  console.log("Geocoding address:", address);
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=AIzaSyDbqqlJ2OHE5XkfZtDr5-rGVsZPO0Jwqeo`
    );
    const data = await response.json();
    if (data.status === "OK") {
      const { lat, lng } = data.results[0].geometry.location;
      const result = { latitude: lat, longitude: lng };
      console.log("Geocoded coordinates:", result);
      return result;
    }
    throw new Error(`Geocoding failed: ${data.status}`);
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// Fetch Directions API data for Polyline fallback
export const fetchDirections = async (origin, destination, apiKey) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error(`Directions API error: ${data.status}`);
    }
    const points = decodePolyline(data.routes[0].overview_polyline.points);
    return points;
  } catch (error) {
    console.error("Error fetching directions:", error);
    return null;
  }
};

// Decode Google Maps polyline
export const decodePolyline = (encoded) => {
  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};