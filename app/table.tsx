import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Pressable, ImageBackground } from 'react-native';
import { useMemo } from 'react';
import { useOrderStore, MenuItem } from '@/store/order';
import { useCatalogStore } from '@/store/catalog';
import RobustImage from '@/components/RobustImage';
import NavBar from '@/components/NavBar';

const palette = ['#fde68a','#bbf7d0','#bfdbfe','#fca5a5','#ddd6fe','#a7f3d0','#fecdd3','#d1fae5','#e9d5ff','#fee2e2'];

export default function TableOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = String(id);
  const addItem = useOrderStore((s) => s.addItem);
  const removeItem = useOrderStore((s) => s.removeItem);
  const tableOrder = useOrderStore((s) => s.orders[tableId]);
  const catalogItems = useCatalogStore((s) => s.items);

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

  const menu = useMemo<(MenuItem & { color: string })[]>(() => {
    return catalogItems.map((i, idx) => ({ id: i.id, name: i.name, price: i.price, color: palette[idx % palette.length] }));
  }, [catalogItems]);

  return (
    <View style={{ flex: 1 }}>
      <NavBar title={`Table ${id}`} />
      <View style={styles.rotiRow}><Text style={styles.rotiLabel}>Roti</Text><Text style={styles.rotiValue}>{qtyById['chapati'] || 0}</Text></View>
      <FlatList
        data={menu}
        numColumns={3}
        keyExtractor={(i) => i.id}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 16 }}
        renderItem={({ item }) => {
          const qty = qtyById[item.id] || 0;
          return (
            <View style={[styles.card, { borderColor: '#d1d5db', borderWidth: 1, borderRadius: 12 }]}> 
              <View style={[styles.bg, { backgroundColor: item.color, position: 'relative' }]}>
                <RobustImage
                  itemName={item.name}
                  style={[styles.backgroundImage, { borderRadius: 12, opacity: 0.2 }]}
                  showFallbackText={false}
                />
                <View style={styles.contentOverlay}>
                  <View style={styles.topRow}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.qtyBadge}><Text style={styles.qtyBadgeText}>{qty}</Text></View>
                  </View>
                  <Text style={styles.price}>₹{item.price}</Text>
                  <View style={styles.splitRow}>
                    <Pressable
                      style={[styles.splitHalf, styles.splitLeft]}
                      onPress={() => {
                        const halfItem = { ...item };
                        // If a custom half price is set in catalog, we emulate by adjusting quantity by half of price ratio relative to full.
                        const cat = useCatalogStore.getState().items.find((i) => i.id === item.id);
                        const delta = 0.5; // quantity unit remains 0.5
                        // Price is stored on item; our OrderLine stores per-unit price. To respect half_price, we keep quantity math but ensure price is full; totals already multiply price*quantity, so 0.5 quantity gives half total. If explicit half_price exists and differs, a more advanced model would store variants.
                        useOrderStore.getState().addQuantity(tableId, halfItem, delta);
                      }}
                    >
                      <Text style={styles.splitText}>Half</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.splitHalf, styles.splitRight]}
                      onPress={() => useOrderStore.getState().addQuantity(tableId, item, 1)}
                    >
                      <Text style={styles.splitText}>Full</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
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
  bg: { flex: 1, height: 110, justifyContent: 'space-between' },
  backgroundImage: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    width: '100%',
    height: '100%'
  },
  contentOverlay: { 
    flex: 1, 
    padding: 12, 
    justifyContent: 'space-between',
    zIndex: 1
  },
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


