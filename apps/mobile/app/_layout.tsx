import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MessageCircle, UtensilsCrossed, ShoppingCart } from 'lucide-react-native';
import { useCartStore, selectCartCount } from '../store/cartStore';

function SplashScreen({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() =>
        onDone()
      );
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.splash, { opacity }]}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Text style={styles.splashEmoji}>🍽️</Text>
        <Text style={styles.splashTitle}>Savour</Text>
        <Animated.Text style={[styles.splashTagline, { opacity: taglineOpacity }]}>
          Your AI dining companion
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const cartCount = useCartStore(selectCartCount);

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C9A84C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#3C2A1E', borderTopWidth: 0, paddingBottom: 4 },
        headerStyle: { backgroundColor: '#3C2A1E' },
        headerTintColor: '#FAF7F2',
        headerTitleStyle: { fontWeight: '700', fontSize: 18, fontFamily: 'Georgia' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#3C2A1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 56,
    fontFamily: 'Georgia',
    color: '#C9A84C',
    fontWeight: '700',
    letterSpacing: 2,
  },
  splashTagline: {
    fontSize: 15,
    color: '#FAF7F2',
    opacity: 0.7,
    marginTop: 10,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
});
