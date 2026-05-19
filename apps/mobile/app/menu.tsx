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

const ITEM_EMOJI: Record<string, string> = {
  'starter-01': '🍞', 'starter-02': '🧀', 'starter-03': '🍅',
  'starter-04': '🥩', 'starter-05': '🥗',
  'main-01': '🍕', 'main-02': '🍄', 'main-03': '🐟',
  'main-04': '🍔', 'main-05': '🍝', 'main-06': '🍝',
  'main-07': '🍗', 'main-08': '🍖',
  'dessert-01': '☕', 'dessert-02': '🍮', 'dessert-03': '🍫', 'dessert-04': '🍯',
  'drink-01': '💧', 'drink-02': '🍋', 'drink-03': '☕',
  'drink-04': '🍷', 'drink-05': '☕', 'drink-06': '🍊',
};

const TAG_COLOURS: Record<string, { bg: string; text: string }> = {
  special: { bg: '#3C2A1E', text: '#C9A84C' },
  vegan: { bg: '#DCFCE7', text: '#166534' },
  vegetarian: { bg: '#F0FDF4', text: '#15803D' },
  'gluten-free': { bg: '#FEF9C3', text: '#854D0E' },
};

const TAG_LABEL: Record<string, string> = {
  special: '⭐ Special',
  vegan: '🌱 Vegan',
  vegetarian: '🥦 Veggie',
  'gluten-free': '🌾 GF',
};

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const { addOne, items: cartItems } = useCartStore();

  const qtyInCart = cartItems.find((c) => c.itemId === item.id)?.quantity ?? 0;
  const isSpecial = item.tags.includes('special');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, delay: index * 45, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: index * 45, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleAdd() {
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 1.4, friction: 3, tension: 300, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true }),
    ]).start();
    addOne({ itemId: item.id, name: item.name, unitPrice: item.price });
  }

  return (
    <Animated.View
      style={[
        styles.card,
        isSpecial && styles.cardSpecial,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {isSpecial && (
        <View style={styles.specialRibbon}>
          <Text style={styles.specialRibbonText}>CHEF'S SPECIAL</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Emoji artwork */}
        <View style={[styles.emojiBox, isSpecial && styles.emojiBoxSpecial]}>
          <Text style={styles.emojiText}>{ITEM_EMOJI[item.id] ?? '🍽️'}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

          {item.tags.filter(t => t !== 'special').length > 0 && (
            <View style={styles.tags}>
              {item.tags.filter(t => t !== 'special').map((tag) => {
                const c = TAG_COLOURS[tag] ?? { bg: '#F3F4F6', text: '#374151' };
                return (
                  <View key={tag} style={[styles.tag, { backgroundColor: c.bg }]}>
                    <Text style={[styles.tagText, { color: c.text }]}>
                      {TAG_LABEL[tag] ?? tag}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Footer: price + add button */}
      <View style={styles.cardFooter}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>£{(item.price / 100).toFixed(2)}</Text>
        </View>

        <View style={styles.footerRight}>
          {qtyInCart > 0 && (
            <View style={styles.inCartBadge}>
              <Text style={styles.inCartText}>{qtyInCart} in cart</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleAdd} activeOpacity={1}>
            <Animated.View style={[styles.addBtn, { transform: [{ scale: btnScale }] }]}>
              <Text style={styles.addBtnText}>+</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
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
      Animated.timing(screenOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
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
        <Text style={styles.loadingText}>Loading menu…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Category pills */}
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
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  centered: { flex: 1, backgroundColor: '#F5F0E8', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#9CA3AF', fontSize: 13 },
  errorEmoji: { fontSize: 36 },
  errorText: { color: '#EF4444', textAlign: 'center', paddingHorizontal: 32, fontSize: 14 },

  pillsWrapper: { height: 64, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#EDE8DF' },
  pillsContent: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#DDD8CF',
    backgroundColor: '#FFFFFF',
  },
  pillActive: { borderColor: '#3C2A1E', backgroundColor: '#3C2A1E' },
  pillEmoji: { fontSize: 14 },
  pillLabel: { fontSize: 13, fontWeight: '600', color: '#3C2A1E' },
  pillLabelActive: { color: '#FAF7F2' },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 14 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSpecial: {
    borderWidth: 1.5,
    borderColor: '#C9A84C44',
    shadowOpacity: 0.14,
  },

  specialRibbon: {
    backgroundColor: '#3C2A1E',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  specialRibbonText: {
    color: '#C9A84C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  cardBody: { flexDirection: 'row', padding: 14, gap: 12 },

  emojiBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emojiBoxSpecial: { backgroundColor: '#3C2A1E11' },
  emojiText: { fontSize: 28 },

  cardInfo: { flex: 1 },
  cardName: { color: '#1C1208', fontWeight: '700', fontSize: 15, fontFamily: 'Georgia' },
  cardDesc: { color: '#6B7280', fontSize: 12.5, marginTop: 3, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  tag: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 999 },
  tagText: { fontSize: 10.5, fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  priceBadge: {
    backgroundColor: '#FDF6E3',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#F0E4B8',
  },
  priceText: { color: '#B8860B', fontWeight: '800', fontSize: 14 },

  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inCartBadge: {
    backgroundColor: '#C9A84C18',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C9A84C44',
  },
  inCartText: { color: '#A07830', fontSize: 11.5, fontWeight: '600' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3C2A1E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3C2A1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  addBtnText: { color: '#FAF7F2', fontSize: 22, lineHeight: 24, fontWeight: '600' },
});
