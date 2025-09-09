import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useCallback, useRef } from 'react';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { View } from 'react-native';

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();
  const tabOrder = useRef(['home','dues','history','analytics','manage']);
  const startX = useRef(0);

  const onHandlerStateChange = useCallback((event: any) => {
    const { state, translationX } = event.nativeEvent || {};
    if (state === State.END) {
      const current = segments[segments.length - 1] as string | undefined;
      const index = current ? tabOrder.current.indexOf(current) : 0;
      if (translationX < -50 && index < tabOrder.current.length - 1) {
        router.replace(`/(tabs)/${tabOrder.current[index + 1]}`);
      } else if (translationX > 50 && index > 0) {
        router.replace(`/(tabs)/${tabOrder.current[index - 1]}`);
      }
    }
  }, [router, segments]);
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
  const manageIcon = useCallback(({ color, size }: { color: string; size: number }) => (
    <Ionicons name="construct" size={size} color={color} />
  ), []);

  const homeOptions = useMemo(() => ({ title: 'Home', tabBarIcon: homeIcon }), [homeIcon]);
  const duesOptions = useMemo(() => ({ title: 'Dues', tabBarIcon: duesIcon }), [duesIcon]);
  const historyOptions = useMemo(() => ({ title: 'History', tabBarIcon: historyIcon }), [historyIcon]);
  const analyticsOptions = useMemo(() => ({ title: 'Analytics', tabBarIcon: analyticsIcon }), [analyticsIcon]);
  const manageOptions = useMemo(() => ({ title: 'Manage', tabBarIcon: manageIcon }), [manageIcon]);

  return (
    <PanGestureHandler onHandlerStateChange={onHandlerStateChange}>
      <View style={{ flex: 1 }}>
        <Tabs screenOptions={screenOptions}>
          <Tabs.Screen name="home" options={homeOptions} />
          <Tabs.Screen name="dues" options={duesOptions} />
          <Tabs.Screen name="history" options={historyOptions} />
          <Tabs.Screen name="analytics" options={analyticsOptions} />
          <Tabs.Screen name="manage" options={manageOptions} />
        </Tabs>
      </View>
    </PanGestureHandler>
  );
}


