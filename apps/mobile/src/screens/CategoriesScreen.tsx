import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { PRODUCTS_API_URL } from '../config/api';

export default function CategoriesScreen({ navigation }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${PRODUCTS_API_URL}/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Home', { categoryId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.chevron}>&rarr;</Text>
            </View>
            {item.description && <Text style={styles.categoryDesc}>{item.description}</Text>}
            {item.children && item.children.length > 0 && (
              <View style={styles.subPillsContainer}>
                {item.children.map((child: any) => (
                  <View key={child.id} style={styles.subPill}>
                    <Text style={styles.subPillText}>{child.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  chevron: { fontSize: 18, color: '#94a3b8' },
  categoryDesc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  subPillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  subPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  subPillText: { fontSize: 11, color: '#475569' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

