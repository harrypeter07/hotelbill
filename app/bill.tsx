import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { useMemo, useState } from 'react';

type Item = { id: string; name: string; price: number; quantity: number };

export default function Bill() {
  const { items } = useLocalSearchParams<{ items?: string }>();
  const parsed: Item[] = useMemo(() => (items ? JSON.parse(items) : []), [items]);
  const [taxPct, setTaxPct] = useState('5');
  const [discountPct, setDiscountPct] = useState('0');

  const subtotal = parsed.reduce((s, it) => s + it.price * it.quantity, 0);
  const tax = (subtotal * (Number(taxPct) || 0)) / 100;
  const discount = (subtotal * (Number(discountPct) || 0)) / 100;
  const total = Math.max(0, subtotal + tax - discount);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>Bill</Text>
      <FlatList
        data={parsed}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1 }}>{item.name} x {item.quantity}</Text>
            <Text>₹{item.price * item.quantity}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16 }}
      />
      <View style={{ padding: 16, gap: 8 }}>
        <View style={styles.row}><Text>Subtotal</Text><Text>₹{subtotal.toFixed(2)}</Text></View>
        <View style={styles.row}><Text>Tax %</Text><TextInput style={styles.input} keyboardType="numeric" value={taxPct} onChangeText={setTaxPct} /></View>
        <View style={styles.row}><Text>Discount %</Text><TextInput style={styles.input} keyboardType="numeric" value={discountPct} onChangeText={setDiscountPct} /></View>
        <View style={styles.row}><Text style={styles.total}>Total</Text><Text style={styles.total}>₹{total.toFixed(2)}</Text></View>

        <Pressable style={styles.primary} onPress={() => router.replace('/home')}>
          <Text style={styles.primaryText}>Paid</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push('/due')}>
          <Text style={styles.secondaryText}>Due Payment</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '600', padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, minWidth: 60, textAlign: 'right' },
  total: { fontSize: 18, fontWeight: '700' },
  primary: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '600' },
  secondary: { backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryText: { color: '#111827', fontWeight: '600' },
});


