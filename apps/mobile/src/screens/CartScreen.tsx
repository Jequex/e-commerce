import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }: any) {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Explore our catalog and discover exciting deals!</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalPrice}>${totalAmount.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => {
            Alert.alert('Checkout', `Proceeding to checkout for $${totalAmount.toFixed(2)}`);
            clearCart();
          }}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16 },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  itemPrice: { fontSize: 14, color: '#4f46e5', fontWeight: 'bold', marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  qtyText: { fontSize: 14, fontWeight: 'bold', minWidth: 18, textAlign: 'center' },
  removeBtn: { padding: 6, marginLeft: 4 },
  removeBtnText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold' },
  footer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  totalLabel: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  checkoutButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  shopButton: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  shopButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});

