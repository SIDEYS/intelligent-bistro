import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Utensils, MessageCircle, UtensilsCrossed, ShoppingCart } from 'lucide-react-native';
import { useCartStore, selectCartCount } from '../store/cartStore';

function Logo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      {/* Monogram badge */}
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: '#C9A84C',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5, shadowRadius: 4,
      }}>
        <Utensils size={16} color="#3C2A1E" strokeWidth={2.5} />
      </View>
      {/* Wordmark */}
      <View>
        <Text style={{ fontFamily: 'Georgia', fontWeight: '700', fontSize: 18, color: '#FAF7F2', letterSpacing: 1.5, lineHeight: 20 }}>
          SAVOUR
        </Text>
        <Text style={{ fontSize: 9, color: '#C9A84C', letterSpacing: 2.5, lineHeight: 11, marginTop: 1 }}>
          AI DINING
        </Text>
      </View>
    </View>
  );
}

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
        {/* Logo badge */}
        <View style={styles.splashBadge}>
          <Utensils size={36} color="#3C2A1E" strokeWidth={2} />
        </View>
        <Text style={styles.splashTitle}>SAVOUR</Text>
        <Animated.Text style={[styles.splashTagline, { opacity: taglineOpacity }]}>
          AI DINING COMPANION
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

function AnimatedCartIcon({ color, size }: { color: string; size: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const cartCount = useCartStore(selectCartCount);
  const prevCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, friction: 3, tension: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]).start();
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <ShoppingCart color={color} size={size} />
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
          headerTitle: () => <Logo />,
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          headerTitle: () => <Logo />,
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          headerTitle: () => <Logo />,
          tabBarLabel: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color, size }) => <AnimatedCartIcon color={color} size={size} />,
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
  splashBadge: {
    width: 88, height: 88, borderRadius: 26,
    backgroundColor: '#C9A84C',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 16,
  },
  splashTitle: {
    fontSize: 44,
    fontFamily: 'Georgia',
    color: '#FAF7F2',
    fontWeight: '700',
    letterSpacing: 8,
  },
  splashTagline: {
    fontSize: 11,
    color: '#C9A84C',
    marginTop: 10,
    letterSpacing: 4,
  },
});
