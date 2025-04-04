import { useContext, useState } from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import { UserDetailContext } from '../../context/UserDetailContext';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router/build';
import { signOut } from 'firebase/auth';
import { auth } from "@/config/firebaseConfig";
import Toast from 'react-native-toast-message';
import toastConfig from '../../config/toastConfig';
export default function profile() {
    const {userDetail, setUserDetail} = useContext(UserDetailContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onSignOutClick = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setUserDetail(null);
            console.log('Signed Out Successfully!')
            router.replace("/");
        } catch (e) {
            console.log(e);
            Toast.show({
                type: 'error',
                text1: 'Error!',
                text2: 'Failed to sign out!'
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <View  style = {styles.container}>
            <Text style={styles.text}>Hello! {userDetail?.name}</Text>
            <Toast config={toastConfig}></Toast>
            <Image source={require('../../assets/images/logo.png')}
            style={{
                width: '50%',
                height: 100,
                marginTop: 35,
                marginBottom: 15
            }}
            />
            <TouchableOpacity
                style = {{
                padding: 15,
                backgroundColor: '#f3400d',
                width: '40%',
                marginTop: 25,
                borderRadius: 10

            }} onPress={()=>router.push('/account/account')}>
                <Text style={{
                    fontFamily: 'oswald-bold',
                    fontSize: 20,
                    color: '#fef0da',
                    textAlign: 'center'
                }}>Account Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style = {{
                padding: 15,
                backgroundColor: '#f3400d',
                width: '40%',
                marginTop: 25,
                borderRadius: 10

            }} onPress={()=>router.push('/account/travelhistory')}>
                <Text style={{
                    fontFamily: 'oswald-bold',
                    fontSize: 20,
                    color: '#fef0da',
                    textAlign: 'center'
                }}>Travel History</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style = {{
                padding: 15,
                backgroundColor: '#f3400d',
                width: '40%',
                marginTop: 25,
                borderRadius: 10

            }} onPress={()=>router.push('/account/settings')}>
                <Text style={{
                    fontFamily: 'oswald-bold',
                    fontSize: 20,
                    color: '#fef0da',
                    textAlign: 'center'
                }}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style = {{
                padding: 15,
                backgroundColor: '#f3400d',
                width: '40%',
                marginTop: 25,
                borderRadius: 10

            }} onPress={()=>router.push('/account/driverSignUp')}>
                <Text style={{
                    fontFamily: 'oswald-bold',
                    fontSize: 20,
                    color: '#fef0da',
                    textAlign: 'center'
                }}>Become a Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress = {onSignOutClick}
                style = {{
                padding: 15,
                backgroundColor: '#f3400d',
                width: '30%',
                marginTop: 25,
                borderRadius: 10

            }}>
                <Text style={{
                    fontFamily: 'oswald-bold',
                    fontSize: 20,
                    color: '#fef0da',
                    textAlign: 'center'
                }}>Sign Out</Text>
            </TouchableOpacity>
        </View>
        
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1e7d',
        alignItems: 'center',
    },
    text: {
        marginTop: 100,
        color: '#eb7f05',
        fontSize: 30,
        fontFamily: 'oswald-bold'
    },
});