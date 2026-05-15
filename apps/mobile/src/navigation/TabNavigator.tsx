import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

function ProfileTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.avatarIcon, focused && styles.avatarIconFocused]}>
      <Feather name="user" size={16} color={focused ? COLORS.bistroCream : COLORS.bistroBrown} />
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.bistroCream,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.bistroBrown,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        headerShadowVisible: true,
        tabBarActiveTintColor: COLORS.bistroGold,
        tabBarInactiveTintColor: COLORS.medGray,
        tabBarStyle: { backgroundColor: COLORS.bistroCream, borderTopColor: COLORS.border },
      }}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} />,
          headerTitle: 'Your Profile',
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  avatarIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.bistroCream2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.bistroWarm,
  },
  avatarIconFocused: {
    backgroundColor: COLORS.bistroBrown,
    borderColor: COLORS.bistroBrown,
  },
});
