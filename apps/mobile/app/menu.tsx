import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MenuItem, MenuCategory } from '@bistro/shared';
import { api } from '../services/api';

const CATEGORIES: { key: MenuCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🍽️' },
  { key: 'starter', label: 'Starters', emoji: '🥗' },
  { key: 'main', label: 'Mains', emoji: '🍝' },
  { key: 'dessert', label: 'Desserts', emoji: '🍮' },
  { key: 'drink', label: 'Drinks', emoji: '🥂' },
];

const TAG_COLOURS: Record<string, { bg: string; text: string }> = {
  vegan: { bg: '#DCFCE7', text: '#166534' },
  vegetarian: { bg: '#F0FDF4', text: '#15803D' },
  'gluten-free': { bg: '#FEF9C3', text: '#854D0E' },
};

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#3C2A1E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text
          style={{
            color: '#3C2A1E',
            fontWeight: '700',
            fontSize: 15,
            flex: 1,
            marginRight: 12,
            fontFamily: 'Georgia',
          }}
        >
          {item.name}
        </Text>
        <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 15 }}>
          £{(item.price / 100).toFixed(2)}
        </Text>
      </View>
      <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4, lineHeight: 19 }}>
        {item.description}
      </Text>
      {item.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {item.tags.map((tag) => {
            const colours = TAG_COLOURS[tag] ?? { bg: '#F3F4F6', text: '#374151' };
            return (
              <View
                key={tag}
                style={{ backgroundColor: colours.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}
              >
                <Text style={{ color: colours.text, fontSize: 11, fontWeight: '600' }}>{tag}</Text>
              </View>
            );
          })}
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
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      {/* Category pills — fixed height so they never stretch */}
      <View style={{ height: 60 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', gap: 8 }}
          style={{ flex: 1 }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: active ? '#3C2A1E' : '#E5E7EB',
                  backgroundColor: active ? '#3C2A1E' : '#FFFFFF',
                }}
              >
                <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: active ? '#FAF7F2' : '#3C2A1E',
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu items */}
      <FlatList
        key={activeCategory}
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => <MenuCard item={item} index={index} />}
      />
    </View>
  );
}
