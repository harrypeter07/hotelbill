import React, { useMemo, useRef } from 'react';
import { PanResponder, View, Animated, Dimensions, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

type Props = {
  children: React.ReactNode;
};

export default function SwipeTabs({ children }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const tabOrder = useMemo(() => ['home', 'dues', 'history', 'analytics', 'manage'], []);
  const threshold = 60;
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwiping = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
        onPanResponderMove: (_, g) => {
          isSwiping.current = true;
          translateX.setValue(g.dx);
        },
        onPanResponderRelease: (_, g) => {
          const current = (segments[segments.length - 1] as string) || 'home';
          const index = tabOrder.indexOf(current);
          const goNext = g.dx <= -threshold && index < tabOrder.length - 1;
          const goPrev = g.dx >= threshold && index > 0;

          if (goNext || goPrev) {
            const toValue = goNext ? -screenWidth : screenWidth;
            Animated.timing(translateX, { toValue, duration: 180, useNativeDriver: true }).start(() => {
              translateX.setValue(0);
              const target = goNext ? tabOrder[index + 1] : tabOrder[index - 1];
              router.replace({ pathname: `/(tabs)/${target}` });
              isSwiping.current = false;
            });
          } else {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(() => {
              isSwiping.current = false;
            });
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(() => {
            isSwiping.current = false;
          });
        },
      }),
    [router, segments, tabOrder]
  );

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});


