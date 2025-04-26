import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { UserDetailContext } from "./../context/UserDetailContext";
import { useState } from "react";

export default function RootLayout() {
  useFonts({
    "oswald-bold": require("./../assets/fonts/Oswald-Bold.ttf"),
    "oswald-medium": require("./../assets/fonts/Oswald-Medium.ttf"),
    "oswald-light": require("./../assets/fonts/Oswald-Light.ttf"),
  });

  const [userDetail, setUserDetail] = useState();

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pages/DriverHome" />
        <Stack.Screen name="pages/RiderHome" />
        <Stack.Screen name="pages/RiderTracking" />
        <Stack.Screen name="pages/DriverTracking" />
        <Stack.Screen name="auth/signIn" />
        <Stack.Screen name="auth/signUp" />
        <Stack.Screen name="account/accountdetails" />
        <Stack.Screen name="account/driverSignUp" />
        <Stack.Screen name="account/settings" />
        <Stack.Screen name="account/travelhistory" />
      </Stack>
    </UserDetailContext.Provider>
  );
}