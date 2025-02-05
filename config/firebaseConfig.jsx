// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpS_GOO6ji1LXvMd2fvxUYZgtFowhm6NU",
  authDomain: "gatorride-7eab7.firebaseapp.com",
  projectId: "gatorride-7eab7",
  storageBucket: "gatorride-7eab7.firebasestorage.app",
  messagingSenderId: "451867723127",
  appId: "1:451867723127:web:24cc264daa8525e8ed4d72",
  measurementId: "G-RKF1Y8XL23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
})
export const db = getFirestore(app);
const analytics = getAnalytics(app);