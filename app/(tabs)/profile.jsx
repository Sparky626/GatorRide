import { useContext, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { UserDetailContext } from '../../context/UserDetailContext';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from "@/config/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import Toast from 'react-native-toast-message';
import toastConfig from '../../config/toastConfig';

export default function Profile() {
    const { userDetail, setUserDetail } = useContext(UserDetailContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onSignOutClick = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setUserDetail(null);
            router.replace("/");
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Error!',
                text2: 'Failed to sign out!'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleDriverMode = async () => {
        setLoading(true);
        try {
            const newDriverStatus = !userDetail.driver;
            const userRef = doc(db, "users", userDetail.email);
            await setDoc(
                userRef,
                { driver: newDriverStatus },
                { merge: true }
            );

            setUserDetail({
                ...userDetail,
                driver: newDriverStatus,
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Error!',
                text2: 'Failed to switch mode',
            });
            console.error("Error toggling driver mode:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.greeting}>Hello, {userDetail?.name || 'User'}!</Text>
            <Toast config={toastConfig} />
            <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
            />
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/account/accountdetails')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Account Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/account/travelhistory')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Travel History</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/account/settings')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Settings</Text>
                </TouchableOpacity>
                {userDetail?.car_details ? (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={toggleDriverMode}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {userDetail.driver ? 'Switch to Ride Mode' : 'Switch to Drive Mode'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/account/driverSignUp')}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Become a Driver</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={onSignOutClick}
                    style={[styles.button, styles.signOutButton]}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Sign Out</Text>
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
    },
    greeting: {
        color: '#eb7f05',
        fontFamily: 'oswald-bold',
        fontSize: 28,
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    logo: {
        width: 230,
        height: 120,
        marginVertical: 20,
    },
    buttonContainer: {
        width: '85%',
        backgroundColor: '#1a2a9b',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#f3400d',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 10,
        width: '90%',
        alignItems: 'center',
    },
    signOutButton: {
        backgroundColor: '#eb7f05',
        width: '60%',
    },
    buttonText: {
        fontFamily: 'oswald-bold',
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});