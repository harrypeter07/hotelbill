import React, { useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

type Props = {
  children: React.ReactNode;
};

export default function SwipeTabs({ children }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const tabOrder = useMemo(() => ['home', 'dues', 'history', 'analytics', 'manage'], []);
  const threshold = 40;
  const isSwiping = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 10,
        onPanResponderMove: () => {
          isSwiping.current = true;
        },
        onPanResponderRelease: (_, gesture) => {
          const current = (segments[segments.length - 1] as string) || 'home';
          const index = tabOrder.indexOf(current);
          if (gesture.dx <= -threshold && index < tabOrder.length - 1) {
            router.replace({ pathname: `/(tabs)/${tabOrder[index + 1]}` });
          } else if (gesture.dx >= threshold && index > 0) {
            router.replace({ pathname: `/(tabs)/${tabOrder[index - 1]}` });
          }
          isSwiping.current = false;
        },
      }),
    [router, segments, tabOrder]
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}


