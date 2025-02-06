import { Stack } from "expo-router";
import {useFonts} from "expo-font";
import { UserDetailContext } from './../context/UserDetailContext'
import { useState } from "react";
export default function RootLayout() {
  useFonts({
    'oswald-bold' : require('./../assets/fonts/Oswald-Bold.ttf'),
    'oswald-medium' : require('./../assets/fonts/Oswald-Medium.ttf'),
    'oswald-light' : require('./../assets/fonts/Oswald-Light.ttf')
  })
  const [userDetail,setUserDetail] = useState();
  return (
  <UserDetailContext.Provider value={{ userDetail, setUserDetail}}>
  <Stack screenOptions={{
    headerShown:false
  }}/>
  </UserDetailContext.Provider>
  );
}
