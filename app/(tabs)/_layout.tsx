import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useCallback } from 'react';

export default function TabsLayout() {
  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarActiveTintColor: '#111827',
    tabBarInactiveTintColor: '#6b7280',
    tabBarStyle: { borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', height: 58, paddingBottom: 8 },
    tabBarLabelStyle: { fontSize: 12 },
  }), []);

  const homeIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <Ionicons name="home" size={size} color={color} />
  ), []);
  const duesIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <Ionicons name="wallet" size={size} color={color} />
  ), []);
  const historyIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <Ionicons name="time" size={size} color={color} />
  ), []);
  const analyticsIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <Ionicons name="stats-chart" size={size} color={color} />
  ), []);

  const homeOptions = useMemo(() => ({ title: 'Home', tabBarIcon: homeIcon }), [homeIcon]);
  const duesOptions = useMemo(() => ({ title: 'Dues', tabBarIcon: duesIcon }), [duesIcon]);
  const historyOptions = useMemo(() => ({ title: 'History', tabBarIcon: historyIcon }), [historyIcon]);
  const analyticsOptions = useMemo(() => ({ title: 'Analytics', tabBarIcon: analyticsIcon }), [analyticsIcon]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="home" options={homeOptions} />
      <Tabs.Screen name="dues" options={duesOptions} />
      <Tabs.Screen name="history" options={historyOptions} />
      <Tabs.Screen name="analytics" options={analyticsOptions} />
    </Tabs>
  );
}


