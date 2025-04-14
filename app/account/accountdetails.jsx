import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { UserDetailContext } from '../../context/UserDetailContext';
import { useState, useContext  } from "react";
import UploadImage from "../components/UploadImage";

export default function AccountDetails() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const handleImageSelected = (uri) => {
    setProfileImage(uri);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile')}
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
          <Text style={styles.infoValue}>[{userDetail?.name}]</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Phone Number:</Text>
          <Text style={styles.infoValue}>[Your Phone]</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>[{userDetail?.email}]</Text>
        </View>
      </View>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1e7d',
    paddingTop: 50,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#f3400d',
    fontFamily: 'oswald-bold',
    fontSize: 22,
    textTransform: 'uppercase',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#eb7f05',
  },
  placeholderImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#1a2a9b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#eb7f05',
  },
  placeholderText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 18,
  },
  infoSection: {
    backgroundColor: '#1a2a9b',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    color: '#eb7f05',
    fontFamily: 'oswald-bold',
    fontSize: 26,
    marginBottom: 15,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  infoLabel: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 18,
    flex: 1,
  },
  infoValue: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 18,
    flex: 2,
    textAlign: 'right',
  },
});