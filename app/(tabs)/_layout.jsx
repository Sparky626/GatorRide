import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useRouter, Slot } from 'expo-router';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Layout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const navigateTo = (path) => {
    router.push(path);
    setMenuVisible(false);
  };

  const menuItems = [
    { name: 'Home', path: '/home', icon: <Entypo name="home" size={24} color="#fff" /> },
    { name: 'Schedule', path: '/schedule', icon: <FontAwesome name="calendar" size={24} color="#fff" /> },
    { name: 'Map', path: '/map', icon: <FontAwesome6 name="map-location-dot" size={24} color="#fff" /> },
    { name: 'Profile', path: '/profile', icon: <Ionicons name="person-circle-sharp" size={24} color="#fff" /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={toggleMenu} style={styles.hamburger}>
          <Entypo name="menu" size={30} color="#f3400d" />
        </TouchableOpacity>
      </View>
      <Slot />
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
              <Entypo name="cross" size={30} color="#fff" />
            </TouchableOpacity>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={styles.menuItem}
                onPress={() => navigateTo(item.path)}
              >
                {item.icon}
                <Text style={styles.menuText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1e7d',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#0b1e7d',
  },
  hamburger: {
    paddingTop: Platform.OS === "ios" ? 0 : 50,
    paddingRight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1a2a9b',
    width: '70%',
    height: '100%',
    padding: 20,
    paddingTop: 50,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuText: {
    color: '#fff',
    fontFamily: 'oswald-bold',
    fontSize: 18,
    marginLeft: 15,
    textTransform: 'uppercase',
  },
});