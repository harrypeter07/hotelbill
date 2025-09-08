import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', height: 58, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => (<Ionicons name="home" size={size} color={color} />) }} />
      <Tabs.Screen name="dues" options={{ title: 'Dues', tabBarIcon: ({ color, size }) => (<Ionicons name="wallet" size={size} color={color} />) }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, size }) => (<Ionicons name="time" size={size} color={color} />) }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ color, size }) => (<Ionicons name="stats-chart" size={size} color={color} />) }} />
    </Tabs>
  );
}


