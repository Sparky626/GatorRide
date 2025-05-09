import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import "react-native-get-random-values";

export default function Index() {
  const router = useRouter();
  const { setUserDetail } = useContext(UserDetailContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          const result = await getDoc(doc(db, "users", user.email));
          if (result.exists()) {
            setUserDetail(result.data());
            router.replace("/home");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, setUserDetail]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f3400d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("./../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to GatorRide</Text>
        <Text style={styles.desc}>
          Carpool with fellow students to get places quick and save money!
        </Text>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push("/auth/signUp")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push("/auth/signIn")}
        >
          <Text style={[styles.buttonText, { color: "#fef0da" }]}>
            Already have an account?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: 320,
    marginTop: 100,
    marginBottom: 50,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    padding: 25,
    backgroundColor: "#1a2a9b",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    textAlign: "center",
    color: "#fef0da",
    fontFamily: "oswald-bold",
    marginBottom: 20,
  },
  desc: {
    fontSize: 25,
    color: "#eb7f05",
    textAlign: "center",
    fontFamily: "oswald-medium",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    padding: 20,
    backgroundColor: "#f3400d",
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  signInButton: {
    padding: 20,
    backgroundColor: "#39347c",
    width: "100%",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fef0da",
    alignItems: "center",
  },
  buttonText: {
    textAlign: "center",
    fontSize: 20,
    fontFamily: "oswald-bold",
    color: "#fef0da",
  },
});
