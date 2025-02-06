import React from 'react';
import { View, Text } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
}

const toastConfig = {
  error: ({ text1, text2 }: CustomToastProps) => (
    <View style={{
      position: 'absolute',
      top: 325,
      left: '5%',
      right: '5%',
      height: 70,
      backgroundColor: '#FF7F7F',
      borderColor: 'red',
      borderWidth: 1,
      padding: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
      {text1 && (
        <Text style={{color:'red', fontSize: 20}}>
          {text1}
        </Text>
      )}
      {text2 && <Text style={{ color: 'black' }}>{text2}</Text>}
    </View>
  ),
  success: ({ text1, text2 }: CustomToastProps) => (
    <View style={{
      position: 'absolute',
      top: 325,
      left: '5%',
      right: '5%',
      height: 70,
      backgroundColor: '#90EE90',
      borderColor: 'green',
      borderWidth: 1,
      padding: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
      {text1 && (
        <Text style={{color:'red', fontSize: 20}}>
          {text1}
        </Text>
      )}
      {text2 && <Text style={{ color: 'black' }}>{text2}</Text>}
    </View>
  )
};

export default toastConfig;