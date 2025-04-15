import { Text, View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useContext } from "react";
import { UserDetailContext } from "../../context/UserDetailContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import DropDownPicker from "react-native-dropdown-picker";

export default function DriverSignUp() {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [carModel, setCarModel] = useState("");
  const [carMake, setCarMake] = useState("");
  const [carYear, setCarYear] = useState("");
  const [mpg, setMpg] = useState("");
  const [gasType, setGasType] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([
    { label: "Regular", value: "Regular" },
    { label: "Midgrade", value: "Midgrade" },
    { label: "Premium", value: "Premium" },
    { label: "Diesel", value: "Diesel" },
  ]);

  const handleSignUp = async () => {
    if (!carModel || !carMake || !carYear || !mpg || !gasType) {
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Please fill in all fields",
      });
      return;
    }

    if (isNaN(carYear) || carYear < 1900 || carYear > new Date().getFullYear() + 1) {
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Please enter a valid year",
      });
      return;
    }

    if (isNaN(mpg) || mpg <= 0) {
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Please enter a valid MPG",
      });
      return;
    }

    setLoading(true);
    try {
      const user = userDetail?.email;
      const uid = userDetail?.uid;
      if (!user || !uid) {
        Toast.show({
          type: "error",
          text1: "Error!",
          text2: "User not found",
        });
        return;
      }

      const vehicleId = Date.now().toString();
      const vehicleData = {
        vehicle_id: vehicleId,
        make: carMake,
        model: carModel,
        year: parseInt(carYear),
        mpg: parseFloat(mpg),
        gas_type: gasType,
        user_id: uid,
      };

      // Update user document with driver status and car details
      const userRef = doc(db, "users", user);
      await setDoc(
        userRef,
        {
          email: userDetail.email || "unknown",
          name: userDetail.name || "Unknown User",
          uid,
          driver: true,
          car_details: vehicleData,
        },
        { merge: true }
      );

      // Save vehicle details to a vehicles subcollection
      const vehicleRef = doc(db, "users", user, "vehicles", vehicleId);
      await setDoc(vehicleRef, vehicleData);

      // Update context
      setUserDetail({
        ...userDetail,
        driver: true,
        car_details: vehicleData,
      });

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "You are now a driver!",
      });

      router.push("/(tabs)/profile");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Failed to sign up as driver",
      });
      console.error("Error signing up as driver:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/profile")}
        style={styles.backButton}
      >
        <Text style={styles.backText}>BACK</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Become a Driver</Text>
      <TextInput
        style={styles.input}
        placeholder="Car Make (e.g., Toyota)"
        placeholderTextColor="#888"
        value={carMake}
        onChangeText={setCarMake}
      />
      <TextInput
        style={styles.input}
        placeholder="Car Model (e.g., Camry)"
        placeholderTextColor="#888"
        value={carModel}
        onChangeText={setCarModel}
      />
      <TextInput
        style={styles.input}
        placeholder="Car Year (e.g., 2020)"
        placeholderTextColor="#888"
        value={carYear}
        onChangeText={setCarYear}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="MPG (e.g., 30)"
        placeholderTextColor="#888"
        value={mpg}
        onChangeText={setMpg}
        keyboardType="numeric"
      />
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Gas Type:</Text>
        <DropDownPicker
          open={open}
          value={gasType}
          items={items}
          setOpen={setOpen}
          setValue={setGasType}
          setItems={setItems}
          placeholder="Select gas type"
          style={styles.picker}
          textStyle={styles.pickerText}
          dropDownContainerStyle={styles.dropDown}
          zIndex={1000}
        />
      </View>
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? "Processing..." : "Sign Up as Driver"}
        </Text>
      </TouchableOpacity>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    alignItems: "center",
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backText: {
    color: "#f3400d",
    fontFamily: "oswald-light",
    fontSize: 20,
    marginTop: 70,
    marginLeft: 20,
  },
  title: {
    color: "#eb7f05",
    fontFamily: "oswald-bold",
    fontSize: 30,
    marginTop: 20,
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fef0da",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontFamily: "oswald-bold",
    fontSize: 16,
    color: "#0b1e7d",
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    color: "#eb7f05",
    fontFamily: "oswald-bold",
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    backgroundColor: "#fef0da",
    borderRadius: 10,
    borderWidth: 0,
  },
  pickerText: {
    fontFamily: "oswald-bold",
    color: "#0b1e7d",
    fontSize: 16,
  },
  dropDown: {
    backgroundColor: "#fef0da",
    borderRadius: 10,
    borderWidth: 0,
  },
  submitButton: {
    backgroundColor: "#f3400d",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#888",
  },
  submitText: {
    color: "#fef0da",
    fontFamily: "oswald-bold",
    fontSize: 20,
  },
});