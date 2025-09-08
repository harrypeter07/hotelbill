import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useState } from 'react';

type MenuItem = { id: string; name: string; price: number };
const MENU: MenuItem[] = [
  { id: 'chapati', name: 'Chapati', price: 15 },
  { id: 'dal', name: 'Dal', price: 60 },
  { id: 'paneer', name: 'Paneer', price: 180 },
  { id: 'rice', name: 'Rice', price: 70 },
  { id: 'curd', name: 'Curd', price: 40 },
  { id: 'water', name: 'Water', price: 20 },
];

export default function TableOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [qty, setQty] = useState<Record<string, number>>({});

  const inc = (key: string) => setQty((q) => ({ ...q, [key]: (q[key] || 0) + 1 }));
  const dec = (key: string) => setQty((q) => ({ ...q, [key]: Math.max(0, (q[key] || 0) - 1) }));

  const orderItems = MENU.filter((m) => (qty[m.id] || 0) > 0).map((m) => ({ ...m, quantity: qty[m.id] || 0 }));

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>Table {id}</Text>
      <FlatList
        data={MENU}
        numColumns={2}
        keyExtractor={(i) => i.id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text>₹{item.price}</Text>
            <View style={styles.row}>
              <Pressable style={styles.btn} onPress={() => dec(item.id)}><Text>-</Text></Pressable>
              <Text style={styles.qty}>{qty[item.id] || 0}</Text>
              <Pressable style={styles.btn} onPress={() => inc(item.id)}><Text>+</Text></Pressable>
            </View>
          </View>
        )}
      />
      <View style={{ padding: 16, gap: 8 }}>
        <Pressable style={styles.primary} onPress={() => { /* keep table open */ }}>
          <Text style={styles.primaryText}>Add Order</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push({ pathname: '/bill', params: { id, items: JSON.stringify(orderItems) } })}>
          <Text style={styles.secondaryText}>Finish & Generate Bill</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '600', padding: 16 },
  card: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, minHeight: 100, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center' },
  primary: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '600' },
  secondary: { backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryText: { color: '#111827', fontWeight: '600' },
});


