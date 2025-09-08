import { Slot } from 'expo-router';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useCatalogStore } from '@/store/catalog';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const hydrated = useCatalogStore((s) => s.hydrated);
  const hydrate = useCatalogStore((s) => s.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
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
