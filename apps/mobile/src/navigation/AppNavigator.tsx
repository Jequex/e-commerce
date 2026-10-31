import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import ContactScreen from '../screens/ContactScreen';
import LegalScreen from '../screens/LegalScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useCart } from '../context/CartContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: 'bold', color: '#0f172a' },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Store',
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🛍️</Text>,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          title: 'Browse Categories',
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🗂️</Text>,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Shopping Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🛒</Text>,
        }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'Contact & Support',
          tabBarLabel: 'Support',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📞</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: 'bold', color: '#0f172a' },
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ title: 'Legal & Policies' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Customer Sign In' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Customer Registration' }} />
    </Stack.Navigator>
  );
}

