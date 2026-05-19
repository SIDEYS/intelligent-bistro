import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCartStore, selectCartTotal } from '../store/cartStore';
import { useChatStore } from '../store/chatStore';
import { api } from '../services/api';
import { CartItem } from '@bistro/shared';

const SERVICE_CHARGE_RATE = 0.1;

function CartRow({ item, index }: { item: CartItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const { incrementItem, decrementItem, removeItem } = useCartStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.row, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
          <TouchableOpacity onPress={() => decrementItem(item.itemId)} style={styles.qtyBtn} activeOpacity={0.7}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => incrementItem(item.itemId)} style={styles.qtyBtn} activeOpacity={0.7}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.itemId)} style={styles.removeBtn} activeOpacity={0.7}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function OrderConfirmedModal({
  orderId,
  waitMinutes,
  onDone,
}: {
  orderId: string;
  waitMinutes: number;
  onDone: () => void;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalCard, { opacity, transform: [{ scale }] }]}>
          <View style={styles.modalIconRing}>
            <Text style={styles.modalIcon}>🎉</Text>
          </View>

          <Text style={styles.modalTitle}>Order Confirmed!</Text>
          <Text style={styles.modalSubtitle}>Your table will be served shortly.</Text>

          <View style={styles.modalDivider} />

          <View style={styles.modalDetail}>
            <Text style={styles.modalDetailLabel}>Order ID</Text>
            <View style={styles.modalIdBadge}>
              <Text style={styles.modalIdText} numberOfLines={1}>{orderId}</Text>
            </View>
          </View>

          <View style={styles.modalDetail}>
            <Text style={styles.modalDetailLabel}>Estimated wait</Text>
            <View style={styles.modalWaitBadge}>
              <Text style={styles.modalWaitText}>⏱ {waitMinutes} min</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onDone} style={styles.modalBtn} activeOpacity={0.85}>
            <Text style={styles.modalBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function CartScreen() {
  const { items, clear } = useCartStore();
  const subtotal = useCartStore(selectCartTotal);
  const serviceCharge = Math.round(subtotal * SERVICE_CHARGE_RATE);
  const total = subtotal + serviceCharge;
  const clearChat = useChatStore((s) => s.clear);
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderId: string; waitMinutes: number } | null>(null);
  const screenOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      screenOpacity.setValue(0);
      Animated.timing(screenOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, [])
  );

  async function confirmOrder() {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const { orderId, estimatedWaitMinutes } = await api.placeOrder(items);
      clear();
      clearChat();
      setOrderResult({ orderId, waitMinutes: estimatedWaitMinutes });
    } catch {
      setOrderResult(null);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0 && !orderResult) {
    return (
      <Animated.View style={[styles.emptyContainer, { opacity: screenOpacity }]}>
        <View style={styles.emptyIconRing}>
          <Text style={styles.emptyEmoji}>🛒</Text>
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <View style={styles.emptyDivider} />
        <Text style={styles.emptySubtitle}>Head to Chat to start your order.</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {orderResult && (
        <OrderConfirmedModal
          orderId={orderResult.orderId}
          waitMinutes={orderResult.waitMinutes}
          onDone={() => setOrderResult(null)}
        />
      )}
      <FlatList
        data={items}
        keyExtractor={(i) => i.itemId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <CartRow item={item} index={index} />}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Order summary card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>£{(subtotal / 100).toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service charge (10%)</Text>
                <Text style={styles.summaryValue}>£{(serviceCharge / 100).toFixed(2)}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>£{(total / 100).toFixed(2)}</Text>
              </View>
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
                <>
                  <Text style={styles.confirmBtnText}>Confirm Order</Text>
                  <Text style={styles.confirmBtnSub}>£{(total / 100).toFixed(2)} · {items.length} item{items.length !== 1 ? 's' : ''}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  list: { padding: 16, gap: 10, paddingBottom: 32 },

  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  itemName: { color: '#1C1208', fontWeight: '700', fontSize: 14, fontFamily: 'Georgia' },
  itemNote: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  itemUnitPrice: { color: '#C9A84C', fontWeight: '700', fontSize: 14 },
  itemPriceTotal: { color: '#9CA3AF', fontSize: 13 },

  rowRight: { alignItems: 'center', gap: 8 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    padding: 2,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  qtyBtnText: { color: '#3C2A1E', fontSize: 16, fontWeight: '600', lineHeight: 18 },
  qtyValue: { color: '#1C1208', fontWeight: '700', fontSize: 15, minWidth: 24, textAlign: 'center' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },

  footer: { marginTop: 8, gap: 16 },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    gap: 10,
  },
  summaryTitle: {
    color: '#1C1208',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Georgia',
    marginBottom: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#6B7280', fontSize: 13 },
  summaryValue: { color: '#3C2A1E', fontSize: 13, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#EDE8DF' },
  totalLabel: { color: '#1C1208', fontWeight: '700', fontSize: 16, fontFamily: 'Georgia' },
  totalValue: { color: '#C9A84C', fontWeight: '800', fontSize: 22 },

  confirmBtn: {
    backgroundColor: '#3C2A1E',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  confirmBtnText: { color: '#FAF7F2', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  confirmBtnSub: { color: '#C9A84C', fontSize: 12, marginTop: 2, fontWeight: '500' },

  emptyContainer: {
    flex: 1, backgroundColor: '#F5F0E8',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  emptyIconRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#3C2A1E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { color: '#1C1208', fontWeight: '700', fontSize: 20, fontFamily: 'Georgia' },
  emptyDivider: { width: 40, height: 2, backgroundColor: '#C9A84C', borderRadius: 1, marginVertical: 12 },
  emptySubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 0 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 18, 8, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
  },
  modalIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3C2A1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalIcon: { fontSize: 38 },
  modalTitle: {
    color: '#1C1208',
    fontWeight: '700',
    fontSize: 22,
    fontFamily: 'Georgia',
    marginBottom: 6,
  },
  modalSubtitle: { color: '#9CA3AF', fontSize: 14, marginBottom: 20 },
  modalDivider: { width: '100%', height: 1, backgroundColor: '#F0EBE3', marginBottom: 20 },

  modalDetail: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalDetailLabel: { color: '#6B7280', fontSize: 13 },
  modalIdBadge: {
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '65%',
  },
  modalIdText: { color: '#3C2A1E', fontSize: 12, fontWeight: '600', fontFamily: 'Georgia' },
  modalWaitBadge: {
    backgroundColor: '#FDF6E3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#F0E4B8',
  },
  modalWaitText: { color: '#B8860B', fontSize: 13, fontWeight: '700' },

  modalBtn: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#3C2A1E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalBtnText: { color: '#FAF7F2', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
});
