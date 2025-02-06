import { View, Text, Image, TextInput, TextInputProps, TouchableOpacity, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import React, {useState, useContext} from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/config/firebaseConfig";
import { UserDetailContext } from "@/context/UserDetailContext";
import Toast from 'react-native-toast-message';
import toastConfig from '../../config/toastConfig';

export default function SignUp(){
    const router = useRouter();
    const [fullName, setFullName]= useState('');
    const [email, setEmail]= useState('');
    const [password, setPassword]= useState('');
    const {userDetail, setUserDetail} = useContext(UserDetailContext);
    const CreateNewAccount = async () => {
        const isUFLDomain = email.trim().endsWith('@ufl.edu');
        if (isUFLDomain == true){
            try {
                const resp = await createUserWithEmailAndPassword(auth, email, password);
                const user = resp.user;
                await updateProfile(user, { displayName: fullName });
                console.log("Created Account for " + user.displayName + "!");
                await sendEmailVerification(user);
                Toast.show({
                    type: 'success',
                    text1: 'Verification Email Sent!',
                    text2: 'Please check your inbox to verify your account.'
                })
                await SaveUser(user);
                router.push('/auth/signIn');
            } catch (e) {
                console.log('Error!');
            }
        }
        else{
            Toast.show({
                type: 'error',
                text1: 'Error!',
                text2: 'Invalid Email not a UF Student!'
            })
        }
    };

    const SaveUser = async (user) => {
        try { 
            await setDoc(doc(db, 'users', email), {
                name: fullName,
                email: email,
                driver: false,
                uid: user?.uid
            });
            console.log("User data saved to db successfully");
            setUserDetail(null);
        } catch (error) {
            console.error("Error saving user:", error);
        }
    };
    

    return (
        <View style = {{
            display: 'flex',
            alignItems: 'center',
            paddingTop: 100,
            flex:1,
            padding:25,
            backgroundColor: '#39347c'

        }}>
            <Image source={require('../../assets/images/logo.png')}
                style={{
                    width: '100%',
                    height: 180,
                    marginBottom: 40
                }}
            />
            <Text style={{
                fontSize: 30,
                fontFamily: 'oswald-bold',
                color: '#fef0da'
            }}>Create New Account</Text>
            <TextInput placeholder="Full Name" onChangeText={(value) => setFullName(value)} style={styles.textInput}/>
            <TextInput placeholder="Email" onChangeText={(value) => setEmail(value)} style={styles.textInput}/>
            <TextInput placeholder="Password" onChangeText={(value) => setPassword(value)} secureTextEntry={true} keyboardType='visible-password' style={styles.textInput}/>
            <Toast config={toastConfig}/>
            <TouchableOpacity
            onPress={CreateNewAccount} 
                style = {{
                padding: 15,
                backgroundColor: '#f3400d',
                width: '100%',
                marginTop: 25,
                borderRadius: 10

            }}>
                <Text style={{
                    fontFamily: 'oswald-bold',
                    fontSize: 20,
                    color: '#fef0da',
                    textAlign: 'center'
                }}>Create Account</Text>
            </TouchableOpacity>
            <View style={{
                display: 'flex', 
                flexDirection: 'row', 
                gap: 5,
                marginTop: 20

            }}>
            <Text style={{fontFamily: 'oswald-bold'}}>Already have an account?</Text>
            <Pressable onPress={() => router.push('/auth/signIn')}
                >
                <Text style={{
                    color: '#f3400d',
                    fontFamily: 'oswald-bold'
                }}>Sign In Here</Text>
            </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    textInput: {
        borderWidth: 1,
        width: '100%',
        padding: 15,
        fontSize: 18,
        marginTop: 20,
        borderRadius: 8,
        fontFamily: 'oswald-light',
        color: '#fef0da'
    }
})