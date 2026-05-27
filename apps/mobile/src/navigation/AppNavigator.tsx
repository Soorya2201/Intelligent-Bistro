import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import CheckoutScreen from '../screens/CheckoutScreen';
import CustomizeSheet from '../components/Customize/CustomizeSheet';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <View style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      {/* Global overlay — sits above navigation, renders when activeLineId is set */}
      <CustomizeSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
