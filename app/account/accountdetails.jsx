import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { UserDetailContext } from "../../context/UserDetailContext";
import { useState, useContext, useEffect } from "react";
import UploadImage from "../components/UploadImage";
import { db, storage } from "../../config/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import * as FileSystem from "expo-file-system";

export default function AccountDetails() {
  const router = useRouter();
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const [profileImage, setProfileImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load profile picture from userDetail on mount
  useEffect(() => {
    if (userDetail?.profile_picture) {
      setProfileImage(userDetail.profile_picture);
    }
  }, [userDetail?.profile_picture]);

  const handleImageSelected = async (uri) => {
    if (!userDetail?.uid) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User not authenticated.",
      });
      return;
    }

    if (!uri || typeof uri !== "string" || !uri.startsWith("file://")) {
      console.error("Invalid URI:", uri);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Invalid image URI. Must be a file:// path.",
      });
      return;
    }

    try {
      console.log("Processing URI:", uri);

      // Check if storage is defined
      if (!storage) {
        throw new Error("Firebase Storage is not initialized");
      }

      // Fetch the image file as a Blob
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Blob created:", { type: blob.type, size: blob.size });

      // Create a reference in Firebase Storage
      const fileExtension = uri.split(".").pop()?.toLowerCase() || "jpg";
      const storageRef = ref(
        storage,
        `profile_pictures/${userDetail.uid}.${fileExtension}`
      );
      console.log("Storage reference:", storageRef.fullPath);

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      console.log("Image uploaded to Storage");

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL:", downloadURL);

      // Update Firestore with the download URL
      const userDocRef = doc(db, "users", userDetail.email);
      await updateDoc(userDocRef, {
        profile_picture: downloadURL,
      });
      console.log("Firestore updated with profile_picture");

      // Update local state and context
      setProfileImage(downloadURL);
      setUserDetail((prev) => ({
        ...prev,
        profile_picture: downloadURL,
      }));

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile picture uploaded successfully.",
      });
    } catch (error) {
      console.error(
        "Error uploading profile picture:",
        error,
        JSON.stringify(error, null, 2)
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Failed to upload profile picture: ${error.message}`,
      });
    }
  };

  const handleViewCarImage = () => {
    if (!userDetail?.car_details?.image_url) {
      Toast.show({
        type: "info",
        text1: "No Image",
        text2: "No car image available.",
      });
      return;
    }
    setModalVisible(true);
  };

  const isDriver = userDetail?.driver;
  const showCarDetails = isDriver || userDetail?.car_details;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/profile")}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>BACK</Text>
      </TouchableOpacity>

      <View style={styles.profileSection}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <UploadImage onImageSelected={handleImageSelected} />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{userDetail?.name || "N/A"}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{userDetail?.email || "N/A"}</Text>
        </View>

        {showCarDetails && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Car Details
            </Text>
            <TouchableOpacity
              style={styles.viewImageButton}
              onPress={handleViewCarImage}
            >
              <Text style={styles.viewImageButtonText}>View Car Image</Text>
            </TouchableOpacity>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Car:</Text>
              <Text style={styles.infoValue}>
                {userDetail?.car_details?.year || "N/A"}{" "}
                {userDetail?.car_details?.make || "N/A"}{" "}
                {userDetail?.car_details?.model || "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Color:</Text>
              <Text style={styles.infoValue}>
                {userDetail?.car_details?.color || "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>MPG/Gas Type:</Text>
              <Text style={styles.infoValue}>
                {userDetail?.car_details?.mpg || "N/A"}/
                {userDetail?.car_details?.gas_type || "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Capacity:</Text>
              <Text style={styles.infoValue}>
                {userDetail?.car_details?.capacity || "N/A"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>License Plate:</Text>
              <Text style={styles.infoValue}>
                {userDetail?.car_details?.license_plate || "N/A"}
              </Text>
            </View>
          </>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {userDetail?.car_details?.image_url ? (
              <Image
                source={{ uri: userDetail.car_details.image_url }}
                style={styles.modalImage}
                resizeMode="stretch"
              />
            ) : (
              <Text style={styles.modalPlaceholderText}>No Car Image</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    paddingTop: Platform.OS === "ios" ? 50 : 15,
  },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 20,
    marginTop: Platform.OS === "ios" ? 10 : 0,
  },
  backButtonText: {
    color: "#f3400d",
    fontFamily: "oswald-bold",
    fontSize: 22,
    textTransform: "uppercase",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#eb7f05",
  },
  placeholderImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#1a2a9b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#eb7f05",
  },
  placeholderText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
  },
  infoSection: {
    backgroundColor: "#1a2a9b",
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    color: "#eb7f05",
    fontFamily: "oswald-bold",
    fontSize: 26,
    marginBottom: 15,
    textAlign: "center",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  infoLabel: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    flex: 1,
  },
  infoValue: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    flex: 2,
    textAlign: "right",
  },
  viewImageButton: {
    backgroundColor: "#eb7f05",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  viewImageButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    textTransform: "uppercase",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a2a9b",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: "90%",
    maxHeight: "80%",
  },
  modalImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#eb7f05",
    marginBottom: 15,
  },
  modalPlaceholderText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: "#f3400d",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
    textTransform: "uppercase",
  },
});
