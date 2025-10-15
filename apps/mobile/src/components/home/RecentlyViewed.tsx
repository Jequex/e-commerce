import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const recentProducts = [
  { id: '1', name: 'iPhone 14 Pro', price: 999 },
  { id: '2', name: 'MacBook Air', price: 1299 },
  { id: '3', name: 'AirPods Pro', price: 249 },
];

export function RecentlyViewed() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recently Viewed</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.recentProductsContainer}>
          {recentProducts.map((product) => (
            <TouchableOpacity key={product.id} style={styles.recentProductCard}>
              <View style={styles.recentProductImage}>
                <MaterialIcons name="image" size={30} color="#ddd" />
              </View>
              <Text style={styles.recentProductName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.recentProductPrice}>${product.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  recentProductsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  recentProductCard: {
    width: 120,
    marginRight: 15,
  },
  recentProductImage: {
    height: 80,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentProductName: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  recentProductPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});