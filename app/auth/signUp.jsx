import { View, Text, Image, TextInput, TouchableOpacity, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useContext } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/config/firebaseConfig";
import { UserDetailContext } from "@/context/UserDetailContext";
import Toast from 'react-native-toast-message';
import toastConfig from '../../config/toastConfig';

export default function SignUp() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUserDetail } = useContext(UserDetailContext);

  const createNewAccount = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all fields.',
      });
      return;
    }

    if (!email.trim().endsWith('@ufl.edu')) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please use a @ufl.edu email address.',
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 6 characters.',
      });
      return;
    }

    try {
      const resp = await createUserWithEmailAndPassword(auth, email, password);
      const user = resp.user;
      await updateProfile(user, { displayName: fullName });
      await sendEmailVerification(user);
      await saveUser(user);
      await signOut(auth);
      Toast.show({
        type: 'success',
        text1: 'Account Created',
        text2: 'Please check your email to verify your account.',
      });
      router.push('/auth/signIn');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: 'Could not create account. Try again.',
      });
    }
  };

  const saveUser = async (user) => {
    try {
      await setDoc(doc(db, 'users', email), {
        name: fullName,
        email: email,
        driver: false,
        uid: user.uid,
      });
      setUserDetail(null);
    } catch (error) {
      console.error("Error saving user:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save user data.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
        <Text style={styles.backButtonText}>BACK</Text>
      </TouchableOpacity>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Create New Account</Text>
      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#888"
        onChangeText={setFullName}
        value={fullName}
        style={styles.textInput}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        onChangeText={setEmail}
        value={email}
        style={styles.textInput}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        style={styles.textInput}
      />
      <TouchableOpacity onPress={createNewAccount} style={styles.createButton}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account?</Text>
        <Pressable onPress={() => router.push('/auth/signIn')}>
          <Text style={styles.signInLink}>Sign In Here</Text>
        </Pressable>
      </View>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 25,
    backgroundColor: '#0b1e7d',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#f3400d',
    fontFamily: 'oswald-bold',
    fontSize: 22,
    textTransform: 'uppercase',
  },
  logo: {
    width: '80%',
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'oswald-bold',
    color: '#fef0da',
    marginBottom: 30,
  },
  textInput: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fef0da',
    borderRadius: 10,
    marginBottom: 20,
    fontFamily: 'oswald-regular',
    fontSize: 16,
    color: '#0b1e7d',
  },
  createButton: {
    padding: 15,
    backgroundColor: '#f3400d',
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'oswald-bold',
    fontSize: 20,
    color: '#fef0da',
  },
  signInContainer: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 20,
  },
  signInText: {
    fontFamily: 'oswald-regular',
    fontSize: 16,
    color: '#fef0da',
  },
  signInLink: {
    fontFamily: 'oswald-bold',
    fontSize: 16,
    color: '#f3400d',
  },
});