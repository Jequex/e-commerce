import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get LAN host IP when running via Expo (e.g. physical device scanning QR code)
const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
const devMachineIp = debuggerHost ? debuggerHost.split(':')[0] : null;

// Determine host:
// - If dev machine IP is known from Expo hostUri, use it so physical phones & emulators reach backend
// - Otherwise fall back to Android emulator gateway (10.0.2.2) or iOS/web (localhost)
const HOST = devMachineIp || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const API_BASE_URL = `http://${HOST}:8080`;
export const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
export const PRODUCTS_API_URL = `${API_BASE_URL}/api/products`;
export const STORES_API_URL = `${API_BASE_URL}/api/stores`;
