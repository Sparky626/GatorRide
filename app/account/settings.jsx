import { Text, View, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState, useContext } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { signOut } from "@firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function Settings() {
  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);
  const [notifications, setNotifications] = useState({
    ride_requests: true,
    status_updates: true,
  });

  const toggleNotification = async (key) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);
    try {
      await updateDoc(doc(db, "users", userDetail.email), {
        settings: { notifications: newNotifications },
      });
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/profile')}
        style={{ alignSelf: 'baseline' }}
      >
        <Text style={{
          color: '#f3400d',
          fontFamily: 'oswald-light',
          fontSize: 20,
          marginTop: 70,
          marginLeft: 20
        }}>BACK</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/profile/edit')}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        {userDetail.role === 'driver' && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/profile/car-details')}
          >
            <Text style={styles.buttonText}>Update Car Details</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Ride Requests</Text>
          <Switch
            value={notifications.ride_requests}
            onValueChange={() => toggleNotification('ride_requests')}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Status Updates</Text>
          <Switch
            value={notifications.status_updates}
            onValueChange={() => toggleNotification('status_updates')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1e7d',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    color: '#eb7f05',
    fontFamily: 'oswald-bold',
    fontSize: 24,
    marginVertical: 20,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1a2a9b',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#eb7f05',
    fontFamily: 'oswald-bold',
    fontSize: 16,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a2a9b',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  toggleLabel: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 16,
  },
});