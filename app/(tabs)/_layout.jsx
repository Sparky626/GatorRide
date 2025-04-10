
import React from 'react'
import { Tabs } from 'expo-router'
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderColor: 'black',
          backgroundColor: 'black'
        },
        tabBarActiveTintColor: '#f3400d'
    }}>
      <Tabs.Screen name="home"
      options={{
        tabBarIcon:({color,size})=> <Entypo name="home" size={24} color="grey"/>,
        tabBarLabel: 'Home'
        }}
      />
      <Tabs.Screen name="schedule"
      options={{
        tabBarIcon:({color,size})=> <FontAwesome name="calendar" size={24} color="grey"/>,
        tabBarLabel: 'Schedule',
      }}/>
      <Tabs.Screen name="map"
      options={{
        tabBarIcon:({color,size})=> <FontAwesome6 name="map-location-dot" size={24} color="grey"/>,
        tabBarLabel: 'Map'
      }}/>
      <Tabs.Screen name="profile"
      options={{
        tabBarIcon:({color,size})=> <Ionicons name="person-circle-sharp" size={24} color="grey" />
        ,tabBarLabel: 'Profile'
      }}/>
    </Tabs>
  )
}