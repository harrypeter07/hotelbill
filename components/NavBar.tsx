import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NavBar({ title }: { title: string }) {
  const [now, setNow] = useState(new Date());
  const navigation = useNavigation();
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        <View style={styles.left}>
          {navigation.canGoBack?.() ? (
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.time}>{now.toLocaleTimeString()}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: 'white' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
    }),
  },
  title: { fontSize: 18, fontWeight: '700' },
  time: { fontVariant: ['tabular-nums'] },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white' },
});


