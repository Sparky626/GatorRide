import { View, Text, Image, TextInput, TouchableOpacity, Pressable, ToastAndroid, ActivityIndicator } from "react-native";
import { StyleSheet } from "react-native";
import React, { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/config/firebaseConfig";
import { getDoc, doc } from "firebase/firestore";
import Toast from 'react-native-toast-message';
import toastConfig from '../../config/toastConfig';
import { UserDetailContext } from "@/context/UserDetailContext";
export default function SignIn(){
    const router = useRouter();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const {userDetail, setUserDetail} = useContext(UserDetailContext);
    const [loading, setLoading]= useState(false);
    const onSignInClick = async () => {
            setLoading(true);
            try {
                const resp = await signInWithEmailAndPassword(auth, email, password)
                const user = resp.user;
                if (user.emailVerified == true){
                    console.log(user);
                    console.log('here');
                    await getUserDetail();
                    setLoading(false);
                    router.replace('/(tabs)/home')
                }
                else{
                    Toast.show({
                        type: 'error',
                        text1: 'Email Not Verified!',
                        text2: 'Check your email for a verification link!'
                    })
                    setLoading(false);
                }
                
            } catch (e) {
                console.log(e);
                Toast.show({
                    type: 'error',
                    text1: 'Error!',
                    text2: 'Incorrect Username and Password!'
                })
                setLoading(false);
            }
        };
    
    const getUserDetail = async()=>{
        const result = await getDoc(doc(db, 'users', email));
        console.log(result.data());
        setUserDetail(result.data());
    }
    return (
        <View style = {{
            display: 'flex',
            alignItems: 'center',
            paddingTop: 70,
            flex:1,
            padding:25,
            backgroundColor: '#39347c'

        }}>
            <TouchableOpacity
                onPress={()=>router.push('/')}
                style = {{
                    alignSelf:'baseline'
                }}>
                    <Text style={{
                        color: '#f3400d',
                        fontFamily: 'oswald-light',
                        fontSize: 20
                    }}>BACK</Text>
            </TouchableOpacity>
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
            }}>Welcome Back</Text>
            <TextInput placeholder="Email" onChangeText={(value)=>setEmail(value)} style={styles.textInput}/>
            <TextInput placeholder="Password" onChangeText={(value) => setPassword(value)} secureTextEntry={true} keyboardType='visible-password' style={styles.textInput}/>
            <Toast config={toastConfig}/>
            <TouchableOpacity 
                onPress={onSignInClick}
                disabled={loading}
                style = {{
                padding: 15,
                backgroundColor: '#f3400d',
                width: '100%',
                marginTop: 25,
                borderRadius: 10

            }}>
                {!loading? <Text style={{
                    fontFamily: 'oswald-bold',
                    fontSize: 20,
                    color: '#fef0da',
                    textAlign: 'center'
                }}>Sign In</Text>:
                <ActivityIndicator size = {'large'} color={'#fef0da'}/>
            }
            </TouchableOpacity>
            <View style={{
                            display: 'flex', 
                            flexDirection: 'row', 
                            gap: 5,
                            marginTop: 20
            
                        }}>
            <Text style={{fontFamily: 'oswald-bold'}}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/auth/signUp')}
                >
                <Text style={{
                    color: '#f3400d',
                    fontFamily: 'oswald-bold'
                }}>Sign Up Here</Text>
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
        fontFamily: 'oswald-light',
        borderRadius: 8,
        color: 'white'
    }
})