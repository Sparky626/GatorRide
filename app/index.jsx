import {Image, Text, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useContext, useEffect } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import 'react-native-get-random-values';
export default function Index() {
  const router = useRouter();
  const {userDetail, setUserDetail} = useContext(UserDetailContext);

  useEffect(() => {
    const persistentLogin = onAuthStateChanged(auth, async (user) => {
        if (user) {
          if (user.emailVerified) {
          try {
            console.log('Logged In!')
            const result = await getDoc(doc(db, "users", user.email));
            setUserDetail(result.data());
            router.replace("/(tabs)/home");
          } catch (error) {
            console.log("Error fetching user details:", error);
          }
        }
      }
    });
    return () => persistentLogin();
  }, [router, setUserDetail])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#39347c'
      }}
    >
      <Image source={require('./../assets/images/logo.png')}
      style={{
        width: '100%',
        height: 200,
        marginTop: 150,
        marginBottom: 100
      }}
      />
      <View style={{
        padding: 25,
        backgroundColor: '#0b1e7d',
        height: '100%',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40
      }}>
        <Text style={{
          fontSize: 30,
          textAlign: 'center',
          color: '#fef0da',
          fontFamily: 'oswald-medium'
        }}>Welcome to GatorRide</Text>
        <Text style={{
          fontSize: 24,
          color: '#f3400d',
          marginTop: 30,
          marginBottom: 28,
          textAlign: 'center',
          fontFamily: 'oswald-light',
        }}>Carpooling with fellow students traveling in the same direction to share rides and save money!</Text>
      
      <TouchableOpacity style={styles.button} onPress={()=>router.push('/auth/signUp')}>
        <Text style={[styles.buttonText, {color: '#39347c'}]}>Get Started</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#39347c', borderWidth: 1, borderColor: '#fef0da'}]} onPress={()=>router.push('/auth/signIn')}>
        <Text style={[styles.buttonText, {color: '#fef0da'}]}>Already have an account?</Text>
      </TouchableOpacity>
      </View>

    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    padding: 20,
    backgroundColor: '#fef0da',
    marginTop: 15,
    borderRadius: 10,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'oswald-bold'
  }
})
