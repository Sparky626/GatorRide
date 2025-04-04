import { Text, View, StyleSheet } from "react-native";

export default function DriverSignUp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Driver Sign Up Page!</Text>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1e7d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#eb7f05',
  },
});