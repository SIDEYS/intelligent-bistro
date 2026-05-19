import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { useChatStore } from '../store/chatStore';
import { useCartStore } from '../store/cartStore';
import { api } from '../services/api';
import { ChatMessage } from '@bistro/shared';

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ item }: { item: ChatMessage }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const isUser = item.role === 'user';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubbleWrapper,
        isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAssistant,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>S</Text>
        </View>
      )}
      <View style={styles.bubbleCol}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
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
    <View style={styles.typingRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>S</Text>
      </View>
      <View style={styles.typingBubble}>
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
    </View>
  );
}

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const { messages, isLoading, error, addMessage, setLoading, setError } = useChatStore();
  const { items: cart, applyDiff } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      screenOpacity.setValue(0);
      Animated.timing(screenOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, [])
  );

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    addMessage(userMessage);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.chat({ messages: [...messages, userMessage], cart });
      addMessage({ role: 'assistant', content: response.reply, timestamp: Date.now() });
      applyDiff(response.cartDiff);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
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
              <View style={styles.emptyIconRing}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
              </View>
              <Text style={styles.emptyTitle}>Welcome to Savour</Text>
              <View style={styles.emptyDivider} />
              <Text style={styles.emptySubtitle}>
                Tell me what you'd like to eat or drink today.{'\n'}I'll take care of the rest.
              </Text>
              <View style={styles.suggestionRow}>
                {["I'd like a pizza", 'Show me vegan options', 'Surprise me'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestion}
                    activeOpacity={0.7}
                    onPress={() => setInput(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => <MessageBubble item={item} />}
        />

        {isLoading && <TypingIndicator />}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
          <TextInput
            style={styles.input}
            placeholder="What would you like today?"
            placeholderTextColor="#B0A898"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={500}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
            style={[styles.sendBtn, (input.trim() && !isLoading) && styles.sendBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F0E8' },
  container: { flex: 1 },
  messageList: { padding: 16, paddingBottom: 8, gap: 12, flexGrow: 1 },

  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleWrapperUser: { flexDirection: 'row-reverse' },
  bubbleWrapperAssistant: {},
  bubbleCol: { flex: 1 },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3C2A1E',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 16,
  },
  avatarText: { color: '#C9A84C', fontWeight: '700', fontSize: 13, fontFamily: 'Georgia' },

  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#3C2A1E',
    borderBottomRightRadius: 5,
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#EDE8DF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  bubbleTextUser: { color: '#FAF7F2', fontSize: 14, lineHeight: 21 },
  bubbleTextAssistant: { color: '#2C1A0E', fontSize: 14, lineHeight: 21 },

  timestamp: { fontSize: 10.5, color: '#B0A898', marginTop: 3, marginLeft: 2 },
  timestampUser: { textAlign: 'right', marginRight: 2 },

  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#EDE8DF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C9A84C' },

  errorText: {
    color: '#EF4444', fontSize: 12, textAlign: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDE8DF',
    backgroundColor: '#F5F0E8',
  },
  inputRowFocused: { borderTopColor: '#C9A84C55' },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD8CF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: '#2C1A0E',
    fontSize: 14,
    maxHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DDD8CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#C9A84C',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  sendIcon: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, paddingHorizontal: 28,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3C2A1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    color: '#1C1208', fontWeight: '700', fontSize: 22,
    fontFamily: 'Georgia', marginBottom: 12, textAlign: 'center',
  },
  emptyDivider: {
    width: 40, height: 2, backgroundColor: '#C9A84C',
    borderRadius: 1, marginBottom: 12,
  },
  emptySubtitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  suggestion: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD8CF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: { color: '#3C2A1E', fontSize: 13, fontWeight: '500' },
});
