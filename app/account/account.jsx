import { Text, View, StyleSheet, TouchableOpacity  } from "react-native";
import { useRouter } from "expo-router";
import { UploadImage } from "../components/UploadImage"
export default function Account() {
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
                      marginLeft: 20,
                  }}>BACK</Text>
            </TouchableOpacity>
      <UploadImage/>
      <Text style={styles.text}>Personal Info: </Text>
      <Text style={styles.text}>Name: </Text>
      <Text style={styles.text}>Phone Number: </Text>
      <Text style={styles.text}>Email: </Text>
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