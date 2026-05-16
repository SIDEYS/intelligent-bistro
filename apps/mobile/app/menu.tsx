import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MenuItem, MenuCategory } from '@bistro/shared';
import { api } from '../services/api';

const CATEGORIES: { key: MenuCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'starter', label: 'Starters' },
  { key: 'main', label: 'Mains' },
  { key: 'dessert', label: 'Desserts' },
  { key: 'drink', label: 'Drinks' },
];

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
      <View className="flex-1 bg-bistro-cream items-center justify-center">
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-bistro-cream items-center justify-center px-8">
        <Text className="text-bistro-red text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bistro-cream">
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveCategory(item.key)}
            className={`px-4 py-2 rounded-full border ${
              activeCategory === item.key
                ? 'bg-bistro-brown border-bistro-brown'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeCategory === item.key ? 'text-bistro-cream' : 'text-bistro-brown'
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <View className="flex-row justify-between items-start">
              <Text className="text-bistro-brown font-semibold text-base flex-1 mr-2">
                {item.name}
              </Text>
              <Text className="text-bistro-gold font-bold text-base">
                £{(item.price / 100).toFixed(2)}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm mt-1 leading-5">{item.description}</Text>
            {item.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-2">
                {item.tags.map((tag) => (
                  <View key={tag} className="bg-bistro-sage/20 px-2 py-0.5 rounded-full">
                    <Text className="text-bistro-sage text-xs font-medium">{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
