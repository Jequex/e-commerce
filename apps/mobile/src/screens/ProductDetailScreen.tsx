import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useCart } from '../context/CartContext';

export default function ProductDetailScreen({ route, navigation }: any) {
  const product = route?.params?.product || {};
  const { addToCart } = useCart();
  const priceNum = Number(product.price) || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.icon}>🛍️</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{product.name || 'Product Details'}</Text>
          <Text style={styles.price}>${priceNum.toFixed(2)}</Text>
        </View>

        {product.sku && (
          <Text style={styles.sku}>SKU: {product.sku}</Text>
        )}

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>In Stock</Text>
          </View>
          {product.category && (
            <View style={[styles.badge, { backgroundColor: '#e0e7ff' }]}>
              <Text style={[styles.badgeText, { color: '#4338ca' }]}>{product.category.name}</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>Description</Text>
        <Text style={styles.description}>
          {product.description || 'No detailed description available for this item.'}
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            addToCart({ id: product.id, name: product.name, price: priceNum, sku: product.sku });
            navigation.navigate('Cart');
          }}
        >
          <Text style={styles.addButtonText}>Add to Cart • ${priceNum.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  imagePlaceholder: {
    height: 260,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 80 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 12 },
  price: { fontSize: 22, fontWeight: '800', color: '#4f46e5' },
  sku: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#15803d', fontSize: 11, fontWeight: 'bold' },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginTop: 16, marginBottom: 8 },
  description: { fontSize: 14, color: '#475569', lineHeight: 22 },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  addButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
});

