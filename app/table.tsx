import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useOrderStore, MenuItem } from '@/store/order';
import { ImageBackground } from 'react-native';
import { getItemImageUri } from '@/lib/images';
import NavBar from '@/components/NavBar';

const MENU: (MenuItem & { color: string })[] = [
  { id: 'chapati', name: 'Chapati', price: 15, color: '#fde68a' },
  { id: 'dal', name: 'Dal', price: 60, color: '#bbf7d0' },
  { id: 'paneer', name: 'Paneer', price: 180, color: '#bfdbfe' },
  { id: 'rice', name: 'Rice', price: 70, color: '#fca5a5' },
  { id: 'curd', name: 'Curd', price: 40, color: '#ddd6fe' },
  { id: 'water', name: 'Water', price: 20, color: '#a7f3d0' },
];

export default function TableOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = String(id);
  const addItem = useOrderStore((s) => s.addItem);
  const removeItem = useOrderStore((s) => s.removeItem);
  const tableOrder = useOrderStore((s) => s.orders[tableId]);

  const lines = useMemo(() => (tableOrder ? Object.values(tableOrder.lines) : []), [tableOrder]);
  const qtyById = useMemo(() => Object.fromEntries(lines.map((l) => [l.id, l.quantity])), [lines]);
  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const taxPct = tableOrder?.taxPct ?? 5;
    const discountPct = tableOrder?.discountPct ?? 0;
    const tax = (subtotal * taxPct) / 100;
    const discount = (subtotal * discountPct) / 100;
    const total = Math.max(0, subtotal + tax - discount);
    return { subtotal, tax, discount, total };
  }, [lines, tableOrder?.taxPct, tableOrder?.discountPct]);

  return (
    <View style={{ flex: 1 }}>
      <NavBar title={`Table ${id}`} />
      <View style={styles.rotiRow}><Text style={styles.rotiLabel}>Roti</Text><Text style={styles.rotiValue}>{qtyById['chapati'] || 0}</Text></View>
      <FlatList
        data={MENU}
        numColumns={3}
        keyExtractor={(i) => i.id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 16 }}
        renderItem={({ item }) => {
          const qty = qtyById[item.id] || 0;
          return (
            <View style={[styles.card, { borderColor: '#d1d5db', borderWidth: 1, borderRadius: 12 }]}> 
              <ImageBackground source={{ uri: getItemImageUri(item.name) }} imageStyle={{ borderRadius: 12, opacity: 0.2 }} style={[styles.bg, { backgroundColor: item.color }]}>
                <View style={styles.topRow}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.qtyBadge}><Text style={styles.qtyBadgeText}>{qty}</Text></View>
                </View>
                <Text style={styles.price}>₹{item.price}</Text>
                <View style={styles.splitRow}>
                  <Pressable style={[styles.splitHalf, styles.splitLeft]} onPress={() => useOrderStore.getState().addQuantity(tableId, item, 0.5)}>
                    <Text style={styles.splitText}>Half</Text>
                  </Pressable>
                  <Pressable style={[styles.splitHalf, styles.splitRight]} onPress={() => useOrderStore.getState().addQuantity(tableId, item, 1)}>
                    <Text style={styles.splitText}>Full</Text>
                  </Pressable>
                </View>
              </ImageBackground>
            </View>
          );
        }}
      />
      <View style={{ padding: 16, gap: 8 }}>
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalLabel}>₹{totals.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.total}>Total</Text><Text style={styles.total}>₹{totals.total.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.secondary} onPress={() => router.push({ pathname: '/bill', params: { id: tableId } })}>
          <Text style={styles.secondaryText}>Finish & Generate Bill</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '600', padding: 16 },
  card: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  bg: { flex: 1, padding: 12, height: 110, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyBadge: { minWidth: 26, height: 22, borderRadius: 11, backgroundColor: 'rgba(17,24,39,0.8)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  qtyBadgeText: { color: 'white', fontWeight: '700' },
  price: { fontWeight: '600' },
  splitRow: { flexDirection: 'row', width: '100%', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#11182733' },
  splitHalf: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: 'white' },
  splitLeft: { borderRightWidth: 1, borderRightColor: '#11182733' },
  splitRight: {},
  splitText: { fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center' },
  primary: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '600' },
  secondary: { backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryText: { color: '#111827', fontWeight: '600' },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  total: { fontSize: 18, fontWeight: '800' },
  hfRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  hfBtn: { flex: 1, borderWidth: 1, borderColor: '#11182733', borderRadius: 8, alignItems: 'center', paddingVertical: 6, backgroundColor: 'white' },
  rotiRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  rotiLabel: { fontSize: 16, fontWeight: '700' },
  rotiValue: { fontSize: 16, fontWeight: '700' },
});


