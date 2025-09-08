import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useOrderStore } from '@/store/order';
import NavBar from '@/components/NavBar';
import { savePaidBill } from '@/lib/transactions';

export default function Bill() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = String(id);
  const tableOrder = useOrderStore((s) => s.orders[tableId]);
  const setAdj = useOrderStore((s) => s.setBillAdjustments);
  const clear = useOrderStore((s) => s.clearTable);

  const lines = useMemo(() => (tableOrder ? Object.values(tableOrder.lines) : []), [tableOrder]);

  const [taxPct, setTaxPct] = useState('5');
  const [discountPct, setDiscountPct] = useState('0');

  useEffect(() => {
    setAdj(tableId, Number(taxPct) || 0, Number(discountPct) || 0);
  }, [tableId, taxPct, discountPct, setAdj]);

  const { subtotal, tax, discount, total } = useMemo(() => {
    const sb = lines.reduce((s, it) => s + it.price * it.quantity, 0);
    const t = (sb * (Number(taxPct) || 0)) / 100;
    const d = (sb * (Number(discountPct) || 0)) / 100;
    return { subtotal: sb, tax: t, discount: d, total: Math.max(0, sb + t - d) };
  }, [lines, taxPct, discountPct]);

  return (
    <View style={{ flex: 1 }}>
      <NavBar title="Bill" />
      <Text style={styles.heading}>Bill</Text>
      <FlatList
        data={lines}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1 }}>{item.name} x {item.quantity}</Text>
            <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
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

        <Pressable style={styles.primary} onPress={async () => {
          try {
            await savePaidBill({
              tableId,
              waiterId: null,
              lines,
              taxPct: Number(taxPct) || 0,
              discountPct: Number(discountPct) || 0,
            });
          } finally {
            clear(tableId);
            router.replace('/(tabs)/home');
          }
        }}>
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


