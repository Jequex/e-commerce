import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const categories = [
  { id: '1', name: 'Electronics', icon: 'smartphone' },
  { id: '2', name: 'Fashion', icon: 'checkroom' },
  { id: '3', name: 'Home', icon: 'home' },
  { id: '4', name: 'Sports', icon: 'fitness-center' },
  { id: '5', name: 'Books', icon: 'menu-book' },
  { id: '6', name: 'Beauty', icon: 'face' },
];

export function Categories() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <MaterialIcons 
                  name={category.icon as any} 
                  size={24} 
                  color="#007AFF" 
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});