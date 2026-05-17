import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MenuItem, MenuCategory } from '@bistro/shared';
import { api } from '../services/api';
import { useCartStore } from '../store/cartStore';

const CATEGORIES: { key: MenuCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🍽️' },
  { key: 'starter', label: 'Starters', emoji: '🥗' },
  { key: 'main', label: 'Mains', emoji: '🍝' },
  { key: 'dessert', label: 'Desserts', emoji: '🍮' },
  { key: 'drink', label: 'Drinks', emoji: '🥂' },
];

const TAG_COLOURS: Record<string, { bg: string; text: string }> = {
  special: { bg: '#3C2A1E', text: '#C9A84C' },
  vegan: { bg: '#DCFCE7', text: '#166534' },
  vegetarian: { bg: '#F0FDF4', text: '#15803D' },
  'gluten-free': { bg: '#FEF9C3', text: '#854D0E' },
};

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const { addOne, items: cartItems } = useCartStore();

  const qtyInCart = cartItems.find((c) => c.itemId === item.id)?.quantity ?? 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleAdd() {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 1.35, friction: 3, tension: 300, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }),
    ]).start();
    addOne({ itemId: item.id, name: item.name, unitPrice: item.price });
  }

  return (
    <Animated.View
      style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
          {item.tags.length > 0 && (
            <View style={styles.tags}>
              {item.tags.map((tag) => {
                const c = TAG_COLOURS[tag] ?? { bg: '#F3F4F6', text: '#374151' };
                return (
                  <View key={tag} style={[styles.tag, { backgroundColor: c.bg }]}>
                    <Text style={[styles.tagText, { color: c.text }]}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardPrice}>£{(item.price / 100).toFixed(2)}</Text>
          <TouchableOpacity onPress={handleAdd} activeOpacity={1}>
            <Animated.View style={[styles.addBtn, { transform: [{ scale: btnScale }] }]}>
              <Text style={styles.addBtnText}>+</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
      {qtyInCart > 0 && (
        <View style={styles.inCartBadge}>
          <Text style={styles.inCartText}>{qtyInCart} in cart</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function MenuScreen() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all');
  const screenOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      screenOpacity.setValue(0);
      Animated.timing(screenOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }, [])
  );

  useEffect(() => {
    api
      .getMenu()
      .then(setMenu)
      .catch(() => setError('Could not load the menu. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === 'all' ? menu : menu.filter((i) => i.category === activeCategory);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Category pills — fixed height, horizontally scrollable */}
      <View style={styles.pillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContent}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.75}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={styles.pillEmoji}>{cat.emoji}</Text>
                <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu items — vertically scrollable */}
      <FlatList
        key={activeCategory}
        data={filtered}
        keyExtractor={(i) => i.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <MenuCard item={item} index={index} />}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  centered: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#EF4444', textAlign: 'center', paddingHorizontal: 32 },

  pillsWrapper: { height: 60, justifyContent: 'center' },
  pillsContent: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  pillActive: { borderColor: '#3C2A1E', backgroundColor: '#3C2A1E' },
  pillEmoji: { fontSize: 13 },
  pillLabel: { fontSize: 13, fontWeight: '600', color: '#3C2A1E' },
  pillLabelActive: { color: '#FAF7F2' },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardInfo: { flex: 1 },
  cardName: { color: '#3C2A1E', fontWeight: '700', fontSize: 15, fontFamily: 'Georgia' },
  cardDesc: { color: '#6B7280', fontSize: 13, marginTop: 4, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 11, fontWeight: '600' },

  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  cardPrice: { color: '#C9A84C', fontWeight: '700', fontSize: 15 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3C2A1E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addBtnText: { color: '#FAF7F2', fontSize: 20, lineHeight: 22, fontWeight: '600' },

  inCartBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#C9A84C22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  inCartText: { color: '#C9A84C', fontSize: 12, fontWeight: '600' },
});
