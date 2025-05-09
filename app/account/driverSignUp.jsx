import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useContext } from "react";
import { UserDetailContext } from "../../context/UserDetailContext";
import { doc, setDoc } from "firebase/firestore";
import { db, storage } from "../../config/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const [licensePlate, setLicensePlate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [color, setColor] = useState("");
  const [variant, setVariant] = useState(null);
  const [bodySize, setBodySize] = useState(null);
  const [openGasType, setOpenGasType] = useState(false);
  const [openVariant, setOpenVariant] = useState(false);
  const [openBodySize, setOpenBodySize] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gasTypeItems, setGasTypeItems] = useState([
    { label: "Regular", value: "Regular" },
    { label: "Midgrade", value: "Midgrade" },
    { label: "Premium", value: "Premium" },
    { label: "Diesel", value: "Diesel" },
  ]);
  const [variantItems, setVariantItems] = useState([
    { label: "Sedan", value: "sedan" },
    { label: "SUV", value: "suv" },
    { label: "Coupe", value: "coupe" },
    { label: "Hatchback", value: "hatchback" },
  ]);
  const [bodySizeItems, setBodySizeItems] = useState([
    { label: "2", value: "2" },
    { label: "4", value: "4" },
  ]);

  const FALLBACK_IMAGE_URL =
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Replace with Firebase Storage URL

  const fetchCarImage = async (make, model, year, color, variant, bodySize) => {
    try {
      const params = new URLSearchParams({
        customer: "img",
        zoomType: "fullscreen",
        paintdescription: color.toLowerCase(),
        modelFamily: model,
        make,
        modelVariant: variant,
        modelYear: year,
        bodySize,
        angle: "01",
      });
      const url = `https://cdn.imagin.studio/getimage?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Imagin.Studio API error: ${response.statusText}`);
      }
      return url;
    } catch (error) {
      console.warn("Failed to fetch car image:", error);
      return FALLBACK_IMAGE_URL;
    }
  };

  const handleSignUp = async () => {
    if (
      !carModel ||
      !carMake ||
      !carYear ||
      !mpg ||
      !gasType ||
      !licensePlate ||
      !capacity ||
      !color ||
      !variant ||
      !bodySize
    ) {
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Please fill all fields",
      });
      return;
    }

    if (
      isNaN(carYear) ||
      carYear < 1900 ||
      carYear > new Date().getFullYear() + 1
    ) {
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

    if (isNaN(capacity) || capacity <= 0) {
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: "Please enter a valid capacity",
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
        license_plate: licensePlate,
        capacity: parseInt(capacity),
        color,
        variant,
        body_size: parseInt(bodySize),
        user_id: uid,
      };

      const carImageUrl = await fetchCarImage(
        carMake,
        carModel,
        carYear,
        color,
        variant,
        bodySize
      );
      console.log("Car image URL:", carImageUrl);

      const response = await fetch(carImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch car image: ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log("Car image Blob:", { type: blob.type, size: blob.size });

      const fileExtension = blob.type.split("/")[1] || "jpg";
      const storageRef = ref(
        storage,
        `car_images/${vehicleId}.${fileExtension}`
      );
      await uploadBytes(storageRef, blob, { metadata: { user_id: uid } });
      console.log("Car image uploaded to Storage");

      const downloadURL = await getDownloadURL(storageRef);
      console.log("Car image download URL:", downloadURL);

      vehicleData.image_url = downloadURL;

      const userRef = doc(db, "users", userDetail.email);
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
      console.error(
        "Error signing up as driver:",
        error,
        JSON.stringify(error, null, 2)
      );
      Toast.show({
        type: "error",
        text1: "Error!",
        text2: `Failed to sign up: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Driver Signup</Text>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Make (e.g., MercedesBenz)"
            placeholderTextColor="#888"
            value={carMake}
            onChangeText={setCarMake}
          />
          <TextInput
            style={styles.input}
            placeholder="Model (e.g., C300)"
            placeholderTextColor="#888"
            value={carModel}
            onChangeText={setCarModel}
          />
          <View style={styles.inputRow}>
            <View style={[styles.pickerContainer, styles.inputHalf]}>
              <DropDownPicker
                open={openVariant}
                value={variant}
                items={variantItems}
                setOpen={setOpenVariant}
                setValue={setVariant}
                setItems={setVariantItems}
                placeholder="Vehicle Type"
                style={styles.picker}
                textStyle={styles.pickerText}
                dropDownContainerStyle={styles.dropDown}
                zIndex={3000}
                placeholderStyle={styles.pickerPlaceholder}
                arrowIconStyle={styles.arrowIcon}
              />
            </View>
            <View style={[styles.pickerContainer, styles.inputHalf]}>
              <DropDownPicker
                open={openBodySize}
                value={bodySize}
                items={bodySizeItems}
                setOpen={setOpenBodySize}
                setValue={setBodySize}
                setItems={setBodySizeItems}
                placeholder="Doors"
                style={styles.picker}
                textStyle={styles.pickerText}
                dropDownContainerStyle={styles.dropDown}
                zIndex={2000}
                placeholderStyle={styles.pickerPlaceholder}
                arrowIconStyle={styles.arrowIcon}
              />
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Color (e.g., Black)"
            placeholderTextColor="#888"
            value={color}
            onChangeText={setColor}
          />
          <TextInput
            style={[styles.input]}
            placeholder="Year (e.g., 2018)"
            placeholderTextColor="#888"
            value={carYear}
            onChangeText={setCarYear}
            keyboardType="numeric"
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="MPG (e.g., 30)"
              placeholderTextColor="#888"
              value={mpg}
              onChangeText={setMpg}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Seats (e.g., 4)"
              placeholderTextColor="#888"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="License Plate (e.g., ABC1234)"
            placeholderTextColor="#888"
            value={licensePlate}
            onChangeText={setLicensePlate}
          />
          <View style={styles.pickerContainer}>
            <DropDownPicker
              open={openGasType}
              value={gasType}
              items={gasTypeItems}
              setOpen={setOpenGasType}
              setValue={setGasType}
              setItems={setGasTypeItems}
              placeholder="Fuel Type"
              style={styles.picker}
              textStyle={styles.pickerText}
              dropDownContainerStyle={styles.dropDown}
              zIndex={1000}
              placeholderStyle={styles.pickerPlaceholder}
              arrowIconStyle={styles.arrowIcon}
            />
          </View>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {loading ? "Processing..." : "Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
        <Toast config={toastConfig} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    padding: 12,
    justifyContent: "flex-start",
    paddingBottom: 15,
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: Platform.OS === "ios" ? 40 : 8,
  },
  backText: {
    color: "#f3400d",
    fontFamily: "oswald-bold",
    fontSize: 25,
    textTransform: "uppercase",
  },
  title: {
    color: "#eb7f05",
    fontFamily: "oswald-bold",
    fontSize: 35,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 40,
  },
  formContainer: {
    backgroundColor: "#1a2a9b",
    borderRadius: 10,
    padding: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    color: "#eb7f05",
    fontFamily: "oswald-bold",
    fontSize: 20,
    marginBottom: 20,
    marginTop: 5,
  },
  input: {
    backgroundColor: "#fef0da",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontFamily: "oswald-bold",
    fontSize: 16,
    color: "#0b1e7d",
    borderWidth: 1,
    borderColor: "#fef0da",
    height: 49.5,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputHalf: {
    height: 49.5,
    width: "49.5%",
  },
  pickerContainer: {
    marginBottom: 10,
  },
  picker: {
    backgroundColor: "#fef0da",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fef0da",
    height: 49.5,
  },
  pickerText: {
    fontFamily: "oswald-bold",
    color: "#0b1e7d",
    fontSize: 14,
  },
  pickerPlaceholder: {
    fontFamily: "oswald-bold",
    color: "#888",
    fontSize: 14,
  },
  dropDown: {
    backgroundColor: "#fef0da",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fef0da",
  },
  arrowIcon: {
    tintColor: "#0b1e7d",
  },
  submitButton: {
    backgroundColor: "#f3400d",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#888",
  },
  submitText: {
    color: "#fef0da",
    fontFamily: "oswald-bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
});
