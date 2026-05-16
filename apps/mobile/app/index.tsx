import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useChatStore } from '../store/chatStore';
import { useCartStore } from '../store/cartStore';
import { api } from '../services/api';
import { ChatMessage } from '@bistro/shared';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { messages, isLoading, error, addMessage, setLoading, setError } = useChatStore();
  const { items: cart, applyDiff } = useCartStore();

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    addMessage(userMessage);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.chat({
        messages: [...messages, userMessage],
        cart,
      });

      addMessage({ role: 'assistant', content: response.reply, timestamp: Date.now() });
      applyDiff(response.cartDiff);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bistro-cream"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-24">
            <Text className="text-4xl mb-3">🍽️</Text>
            <Text className="text-bistro-brown font-semibold text-lg">Welcome to The Bistro</Text>
            <Text className="text-gray-500 text-sm mt-1 text-center px-8">
              Tell me what you'd like to eat or drink today.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            className={`max-w-[80%] px-4 py-3 rounded-2xl ${
              item.role === 'user'
                ? 'self-end bg-bistro-brown'
                : 'self-start bg-white border border-gray-100'
            }`}
          >
            <Text
              className={`text-sm leading-5 ${
                item.role === 'user' ? 'text-bistro-cream' : 'text-bistro-brown'
              }`}
            >
              {item.content}
            </Text>
          </View>
        )}
      />

      {isLoading && (
        <View className="px-4 pb-2 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#C9A84C" />
          <Text className="text-gray-400 text-xs">Waiter is typing…</Text>
        </View>
      )}

      {error && (
        <Text className="text-bistro-red text-xs text-center px-4 pb-2">{error}</Text>
      )}

      <View className="flex-row items-end px-4 pb-4 gap-2">
        <TextInput
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-bistro-brown text-sm"
          placeholder="What would you like today?"
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          multiline
          maxLength={500}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            input.trim() && !isLoading ? 'bg-bistro-gold' : 'bg-gray-200'
          }`}
        >
          <Text className="text-white font-bold text-lg">↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
