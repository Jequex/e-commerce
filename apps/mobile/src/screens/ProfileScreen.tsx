import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function ProfileScreen({ navigation }: any) {
  const { user, isAuthenticated, logout } = useAuth();
  const [adminUrl, setAdminUrl] = useState('http://localhost:3006');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/store/settings/contact`)
      .then((res) => res.json())
      .then((data) => {
        if (data.admin_app_url || data.adminAppUrl) {
          setAdminUrl(data.admin_app_url || data.adminAppUrl);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user ? `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}` : '👤'}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Guest Shopper'}
        </Text>
        <Text style={styles.userEmail}>{user?.email || 'Sign in to sync orders and cart'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account & Services</Text>

        {!isAuthenticated ? (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.rowText}>Sign In / Create Account</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.rowText}>My Shopping Cart</Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Contact')}>
          <Text style={styles.rowText}>Customer Support & Office Info</Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Legal')}>
          <Text style={styles.rowText}>Legal Policies & Terms (v1.0)</Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.row, { borderLeftWidth: 4, borderLeftColor: '#f59e0b' }]} 
          onPress={() => Linking.openURL(adminUrl)}
        >
          <Text style={[styles.rowText, { color: '#b45309', fontWeight: 'bold' }]}>Merchant & Admin Portal ↗</Text>
          <Text style={styles.rowArrow}>→</Text>
        </TouchableOpacity>

        {isAuthenticated && (
          <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  section: { padding: 16, marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', marginBottom: 12, marginLeft: 4 },
  row: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  rowArrow: { fontSize: 16, color: '#94a3b8' },
  logoutRow: { marginTop: 12, borderColor: '#fecaca', backgroundColor: '#fff5f5' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
});

