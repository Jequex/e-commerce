import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function DealsSection() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Deals</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.dealsContainer}>
        <TouchableOpacity style={styles.dealCard}>
          <View style={styles.dealBadge}>
            <Text style={styles.dealBadgeText}>50% OFF</Text>
          </View>
          <View style={styles.dealContent}>
            <MaterialIcons name="flash-on" size={24} color="#FF6B35" />
            <Text style={styles.dealTitle}>Flash Sale</Text>
            <Text style={styles.dealSubtitle}>Limited time offer</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dealCard}>
          <View style={styles.dealBadge}>
            <Text style={styles.dealBadgeText}>FREE SHIPPING</Text>
          </View>
          <View style={styles.dealContent}>
            <MaterialIcons name="local-shipping" size={24} color="#4CAF50" />
            <Text style={styles.dealTitle}>Free Delivery</Text>
            <Text style={styles.dealSubtitle}>On orders over $50</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  dealsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
  },
  dealCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dealBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dealBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dealContent: {
    alignItems: 'center',
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  dealSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});