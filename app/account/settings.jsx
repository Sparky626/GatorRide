import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Settings() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity
              onPress={()=>router.push('/(tabs)/profile')}
              style = {{
                  alignSelf:'baseline'
              }}>
                  <Text style={{
                      color: '#f3400d',
                      fontFamily: 'oswald-light',
                      fontSize: 20,
                      marginTop: 70,
                      marginLeft: 20
                  }}>BACK</Text>
            </TouchableOpacity>
      <Text style={styles.text}>Settings Page!</Text>
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
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#eb7f05',
  },
});