import { Slot } from 'expo-router';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useCatalogStore } from '@/store/catalog';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash screen visible while we load resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const hydrated = useCatalogStore((s) => s.hydrated);
  const hydrate = useCatalogStore((s) => s.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => {
    if (hydrated) {
      // Give React a frame to render, then hide the splash
      const t = setTimeout(() => { SplashScreen.hideAsync().catch(() => {}); }, 50);
      return () => clearTimeout(t);
    }
  }, [hydrated]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {hydrated ? (
        <Slot />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </GestureHandlerRootView>
  );
}
