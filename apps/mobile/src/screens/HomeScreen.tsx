import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import { PRODUCTS_API_URL } from '../config/api';
import { useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart } = useCart();

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${PRODUCTS_API_URL}?limit=30`).then((r) => r.json()),
        fetch(`${PRODUCTS_API_URL}/categories`).then((r) => r.json()),
      ]);

      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
    } catch (e) {
      console.error('Failed to load mobile products', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.storeTitle}>JEQUEX STORE</Text>
        <Text style={styles.storeSubtitle}>Official Customer Mobile App</Text>
      </View>

      {/* Category Pills Scroller */}
      <View style={styles.categoryScrollerWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All Items</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products available in this category.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                style={styles.cardContent}
              >
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: item.images[0].src }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderIcon}>🛍️</Text>
                  </View>
                )}
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>${Number(item.price).toFixed(2)}</Text>
                {item.sku && <Text style={styles.productSku}>SKU: {item.sku}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addToCart({ id: item.id, name: item.name, price: Number(item.price), sku: item.sku })}
              >
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBanner: {
    backgroundColor: '#0f172a',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  storeTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 },
  storeSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  categoryScrollerWrapper: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  categoryContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: { backgroundColor: '#4f46e5' },
  categoryText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  categoryTextActive: { color: '#ffffff', fontWeight: 'bold' },
  productList: { padding: 12 },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  cardImage: {
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderIcon: { fontSize: 36 },
  productName: { fontSize: 14, fontWeight: '600', color: '#1e293b', minHeight: 36 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5', marginTop: 4 },
  productSku: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#64748b' },
});

