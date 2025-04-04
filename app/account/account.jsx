import { Text, View, StyleSheet } from "react-native";

export default function Account() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Account Details Page!</Text>
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