import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { StyleSheet } from "react-native";
import React, { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { auth, db } from "@/config/firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";
import { UserDetailContext } from "@/context/UserDetailContext";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUserDetail } = useContext(UserDetailContext);
  const [loading, setLoading] = useState(false);

  const onSignInClick = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please enter both email and password.",
      });
      return;
    }

    setLoading(true);
    try {
      const resp = await signInWithEmailAndPassword(auth, email, password);
      const user = resp.user;
      if (user.emailVerified) {
        await getUserDetail(user.email);
        router.replace("/home");
      } else {
        Toast.show({
          type: "error",
          text1: "Email Not Verified",
          text2: "Please check your email for a verification link.",
        });
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Sign In Failed",
        text2: "Incorrect email or password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserDetail = async (email) => {
    try {
      const result = await getDoc(doc(db, "users", email));
      if (result.exists()) {
        setUserDetail(result.data());
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "User data not found.",
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/")}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>BACK</Text>
      </TouchableOpacity>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        onChangeText={setEmail}
        value={email}
        style={styles.textInput}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        style={styles.textInput}
        editable={!loading}
      />
      <TouchableOpacity
        onPress={onSignInClick}
        disabled={loading}
        style={[styles.signInButton, loading && styles.disabledButton]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fef0da" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account?</Text>
        <Pressable onPress={() => router.push("/auth/signUp")}>
          <Text style={styles.signUpLink}>Sign Up Here</Text>
        </Pressable>
      </View>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 25,
    backgroundColor: "#0b1e7d",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#f3400d",
    fontFamily: "oswald-bold",
    fontSize: 22,
    textTransform: "uppercase",
  },
  logo: {
    width: "80%",
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: "oswald-bold",
    color: "#fef0da",
    marginBottom: 30,
  },
  textInput: {
    width: "100%",
    padding: 15,
    backgroundColor: "#fef0da",
    borderRadius: 10,
    marginBottom: 20,
    fontFamily: "oswald-regular",
    fontSize: 16,
    color: "#0b1e7d",
  },
  signInButton: {
    padding: 15,
    backgroundColor: "#f3400d",
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#888",
  },
  buttonText: {
    fontFamily: "oswald-bold",
    fontSize: 20,
    color: "#fef0da",
  },
  signUpContainer: {
    flexDirection: "row",
    gap: 5,
    marginTop: 20,
  },
  signUpText: {
    fontFamily: "oswald-regular",
    fontSize: 16,
    color: "#fef0da",
  },
  signUpLink: {
    fontFamily: "oswald-bold",
    fontSize: 16,
    color: "#f3400d",
  },
});
