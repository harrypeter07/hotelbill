import { Slot } from 'expo-router';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { useCatalogStore } from '@/store/catalog';

export default function App() {
  const hydrated = useCatalogStore((s) => s.hydrated);
  const hydrate = useCatalogStore((s) => s.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {hydrated ? <Slot /> : null}
    </GestureHandlerRootView>
  );
}
