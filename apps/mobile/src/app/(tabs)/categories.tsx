import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const categories = [
  { id: 'all', name: 'All Categories', count: 150 },
  { id: 'electronics', name: 'Electronics', count: 45 },
  { id: 'fashion', name: 'Fashion', count: 32 },
  { id: 'home', name: 'Home & Garden', count: 28 },
  { id: 'sports', name: 'Sports & Outdoors', count: 21 },
  { id: 'books', name: 'Books', count: 15 },
  { id: 'beauty', name: 'Beauty & Personal Care', count: 9 },
];

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories List */}
      <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
        {categories
          .filter(category => 
            category.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory === category.id && styles.selectedCategoryItem
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <View style={styles.categoryIcon}>
                <MaterialIcons 
                  name="category" 
                  size={24} 
                  color={selectedCategory === category.id ? '#007AFF' : '#666'} 
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.selectedCategoryName
                ]}>
                  {category.name}
                </Text>
                <Text style={styles.categoryCount}>
                  {category.count} items
                </Text>
              </View>
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color="#ccc" 
              />
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Popular Categories Section */}
      <View style={styles.popularSection}>
        <Text style={styles.sectionTitle}>Popular This Week</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.popularCategoriesContainer}>
            {categories.slice(1, 5).map((category) => (
              <TouchableOpacity key={`popular-${category.id}`} style={styles.popularCategoryCard}>
                <View style={styles.popularCategoryIcon}>
                  <MaterialIcons name="trending-up" size={20} color="#FF6B35" />
                </View>
                <Text style={styles.popularCategoryName} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCategoryItem: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  selectedCategoryName: {
    color: '#007AFF',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  popularSection: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  popularCategoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  popularCategoryCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 15,
  },
  popularCategoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularCategoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});