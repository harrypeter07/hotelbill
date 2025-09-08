import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useOrderStore } from '@/store/order';
import { useCatalogStore } from '@/store/catalog';
import NavBar from '@/components/NavBar';

export default function Analytics() {
  const orders = useOrderStore((s) => s.orders);
  const items = useCatalogStore((s) => s.items);
  const dailyTotals = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Array.from({ length: 7 }).map((_, i) => {
      const dayStart = now - (6 - i) * dayMs;
      const dateKey = new Date(dayStart).toDateString();
      return { key: dateKey, total: 0 };
    });
    const map = new Map(days.map((d) => [d.key, d]));
    Object.values(orders).forEach((t) => {
      const total = Object.values(t.lines).reduce((s, l) => s + l.price * l.quantity, 0);
      const key = new Date().toDateString();
      const bucket = map.get(key);
      if (bucket) bucket.total += total;
    });
    return days;
  }, [orders]);

  const maxVal = Math.max(1, ...dailyTotals.map((d) => d.total));
  const chartHeight = 120;

  return (
    <View style={styles.container}>
      <NavBar title="Analytics" />
      <Text style={styles.title}>Sales (last 7 days)</Text>
      <View style={{ height: chartHeight, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingTop: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {dailyTotals.map((d) => {
            const h = Math.round((d.total / maxVal) * (chartHeight - 16));
            return (
              <View key={d.key} style={{ width: 24, height: h, backgroundColor: '#111827', borderRadius: 6 }} />
            );
          })}
        </View>
      </View>
      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Totals</Text>
      <Text>Today: ₹{dailyTotals[6].total.toFixed(2)}</Text>
      <Text>Max Day: ₹{maxVal.toFixed(2)}</Text>

      <View style={{ height: 16 }} />
      <Text style={styles.title}>By Category (today)</Text>
      {(() => {
        const catTotals = new Map<string, number>();
        Object.values(orders).forEach((t) => {
          Object.values(t.lines).forEach((l) => {
            const cat = items.find((i) => i.id === l.id)?.category ?? 'Other';
            catTotals.set(cat, (catTotals.get(cat) || 0) + l.price * l.quantity);
          });
        });
        const rows = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]);
        return rows.map(([cat, total]) => (
          <View key={cat} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>{cat}</Text>
            <Text>₹{total.toFixed(2)}</Text>
          </View>
        ));
      })()}

      <View style={{ height: 16 }} />
      <Text style={styles.title}>Top Items (today)</Text>
      {(() => {
        const map = new Map<string, { name: string; total: number }>();
        Object.values(orders).forEach((t) => {
          Object.values(t.lines).forEach((l) => {
            const prev = map.get(l.id)?.total || 0;
            map.set(l.id, { name: l.name, total: prev + l.price * l.quantity });
          });
        });
        return Array.from(map.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map((r) => (
            <View key={r.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>{r.name}</Text>
              <Text>₹{r.total.toFixed(2)}</Text>
            </View>
          ));
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
});


