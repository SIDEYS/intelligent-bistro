import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCartStore, selectCartTotal } from '../store/cartStore';
import { useChatStore } from '../store/chatStore';
import { api } from '../services/api';

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
        'Order Placed!',
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
      <View className="flex-1 bg-bistro-cream items-center justify-center">
        <Text className="text-4xl mb-3">🛒</Text>
        <Text className="text-bistro-brown font-semibold text-lg">Your cart is empty</Text>
        <Text className="text-gray-500 text-sm mt-1">
          Head to Chat to start your order.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bistro-cream">
      <FlatList
        data={items}
        keyExtractor={(i) => i.itemId}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl px-4 py-3 border border-gray-100 flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className="text-bistro-brown font-semibold text-sm">{item.name}</Text>
              {item.customisation && (
                <Text className="text-gray-400 text-xs mt-0.5">{item.customisation}</Text>
              )}
              <Text className="text-gray-400 text-xs mt-0.5">Qty: {item.quantity}</Text>
            </View>
            <Text className="text-bistro-gold font-bold text-sm">
              £{((item.unitPrice * item.quantity) / 100).toFixed(2)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View className="mt-4 border-t border-gray-200 pt-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-bistro-brown font-bold text-lg">Total</Text>
              <Text className="text-bistro-gold font-bold text-xl">
                £{(total / 100).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={confirmOrder}
              disabled={placing}
              className="bg-bistro-brown rounded-2xl py-4 items-center"
            >
              {placing ? (
                <ActivityIndicator color="#FAF7F2" />
              ) : (
                <Text className="text-bistro-cream font-bold text-base">Confirm Order</Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
