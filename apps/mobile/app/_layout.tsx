import '../global.css';
import { Tabs } from 'expo-router';
import { MessageCircle, UtensilsCrossed, ShoppingCart } from 'lucide-react-native';
import { useCartStore, selectCartCount } from '../store/cartStore';

export default function RootLayout() {
  const cartCount = useCartStore(selectCartCount);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C9A84C',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#3C2A1E', borderTopWidth: 0 },
        headerStyle: { backgroundColor: '#3C2A1E' },
        headerTintColor: '#FAF7F2',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
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
