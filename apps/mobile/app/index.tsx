import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
} from 'react-native';
import { useChatStore } from '../store/chatStore';
import { useCartStore } from '../store/cartStore';
import { api } from '../services/api';
import { ChatMessage } from '@bistro/shared';

function MessageBubble({ item }: { item: ChatMessage }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const isUser = item.role === 'user';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
        {item.content}
      </Text>
    </Animated.View>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          ]}
        />
      ))}
    </View>
  );
}

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>Welcome to Savour</Text>
            <Text style={styles.emptySubtitle}>
              Tell me what you'd like to eat or drink today. I'll take care of the rest.
            </Text>
          </View>
        }
        renderItem={({ item }) => <MessageBubble item={item} />}
      />

      {isLoading && <TypingIndicator />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
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
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() && !isLoading ? '#C9A84C' : '#E5E7EB' },
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  messageList: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    marginBottom: 2,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#3C2A1E',
    borderBottomRightRadius: 6,
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  bubbleTextUser: { color: '#FAF7F2', fontSize: 14, lineHeight: 21 },
  bubbleTextAssistant: { color: '#3C2A1E', fontSize: 14, lineHeight: 21 },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C9A84C' },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: '#3C2A1E',
    fontSize: 14,
    maxHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    color: '#3C2A1E',
    fontWeight: '700',
    fontSize: 20,
    fontFamily: 'Georgia',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
