import { Text, View, StyleSheet } from 'react-native';

export default function Account() {
    return (
        <View  style = {styles.container}>
            <Text style={styles.text}>Account</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1e7d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#eb7f05'
    },
});