import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
} from 'react-native';
import { useCartStore, selectCartTotal } from '../store/cartStore';
import { useChatStore } from '../store/chatStore';
import { api } from '../services/api';
import { CartItem } from '@bistro/shared';

function CartRow({ item, index }: { item: CartItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cartRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.cartRowLeft}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        {item.customisation ? (
          <Text style={styles.cartItemNote}>{item.customisation}</Text>
        ) : null}
        <Text style={styles.cartItemQty}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.cartItemPrice}>
        £{((item.unitPrice * item.quantity) / 100).toFixed(2)}
      </Text>
    </Animated.View>
  );
}

export default function CartScreen() {
  const { items, clear } = useCartStore();
  const total = useCartStore(selectCartTotal);
  const clearChat = useChatStore((s) => s.clear);
  const [placing, setPlacing] = useState(false);

  async function confirmOrder() {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const { orderId, estimatedWaitMinutes } = await api.placeOrder(items);
      clear();
      clearChat();
      Alert.alert(
        '🎉 Order Placed!',
        `Your order ${orderId} is confirmed.\nEstimated wait: ${estimatedWaitMinutes} minutes.`,
        [{ text: 'Great, thanks!' }]
      );
    } catch {
      Alert.alert('Error', 'Could not place your order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Head to Chat to start your order.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.itemId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <CartRow item={item} index={index} />}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{(total / 100).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              onPress={confirmOrder}
              disabled={placing}
              style={styles.confirmBtn}
              activeOpacity={0.85}
            >
              {placing ? (
                <ActivityIndicator color="#FAF7F2" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  list: { padding: 16, gap: 10, paddingBottom: 24 },
  cartRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cartRowLeft: { flex: 1, marginRight: 12 },
  cartItemName: { color: '#3C2A1E', fontWeight: '600', fontSize: 14, fontFamily: 'Georgia' },
  cartItemNote: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  cartItemQty: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  cartItemPrice: { color: '#C9A84C', fontWeight: '700', fontSize: 15 },
  footer: { marginTop: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginBottom: 20,
  },
  totalLabel: { color: '#3C2A1E', fontWeight: '700', fontSize: 17, fontFamily: 'Georgia' },
  totalValue: { color: '#C9A84C', fontWeight: '700', fontSize: 22 },
  confirmBtn: {
    backgroundColor: '#3C2A1E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  confirmBtnText: { color: '#FAF7F2', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { color: '#3C2A1E', fontWeight: '700', fontSize: 18, fontFamily: 'Georgia' },
  emptySubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 6 },
});
