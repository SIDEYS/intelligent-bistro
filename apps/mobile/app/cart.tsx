import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { useCartStore, selectCartTotal } from '../store/cartStore';
import { useChatStore } from '../store/chatStore';
import { api } from '../services/api';
import { CartItem } from '@bistro/shared';

function CartRow({ item, index }: { item: CartItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const { incrementItem, decrementItem, removeItem } = useCartStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.row, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.customisation ? <Text style={styles.itemNote}>{item.customisation}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Text style={styles.itemUnitPrice}>£{(item.unitPrice / 100).toFixed(2)}</Text>
          {item.quantity > 1 && (
            <Text style={styles.itemPriceTotal}>
              × {item.quantity} = £{((item.unitPrice * item.quantity) / 100).toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rowRight}>
        <View style={styles.qtyControls}>
          <TouchableOpacity
            onPress={() => decrementItem(item.itemId)}
            style={styles.qtyBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => incrementItem(item.itemId)}
            style={styles.qtyBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => removeItem(item.itemId)}
          style={styles.removeBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}


export default function CartScreen() {
  const { items, clear } = useCartStore();
  const total = useCartStore(selectCartTotal);
  const clearChat = useChatStore((s) => s.clear);
  const [placing, setPlacing] = useState(false);
  const screenOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      screenOpacity.setValue(0);
      Animated.timing(screenOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }, [])
  );

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
      <Animated.View style={[styles.empty, { opacity: screenOpacity }]}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items from the Menu or ask the AI waiter.</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.itemId}
        style={styles.list}
        contentContainerStyle={styles.listContent}
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
              activeOpacity={0.65}
              style={styles.confirmBtn}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32, gap: 10 },

  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  itemName: { color: '#3C2A1E', fontWeight: '600', fontSize: 14, fontFamily: 'Georgia' },
  itemNote: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  itemUnitPrice: { color: '#C9A84C', fontWeight: '700', fontSize: 14 },
  itemPriceTotal: { color: '#9CA3AF', fontSize: 13 },

  rowRight: { alignItems: 'flex-end', gap: 8 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#3C2A1E', lineHeight: 20 },
  qtyValue: { fontSize: 15, fontWeight: '700', color: '#3C2A1E', minWidth: 20, textAlign: 'center' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 11, color: '#DC2626', fontWeight: '700' },

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

  empty: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { color: '#3C2A1E', fontWeight: '700', fontSize: 18, fontFamily: 'Georgia' },
  emptySubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});
