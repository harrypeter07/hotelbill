import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useOrderStore } from '@/store/order';
import { Svg, Rect } from 'react-native-svg';
import NavBar from '@/components/NavBar';

export default function Analytics() {
  const orders = useOrderStore((s) => s.orders);
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
  const chartWidth = 320;
  const chartHeight = 120;
  const barWidth = Math.floor(chartWidth / dailyTotals.length) - 8;

  return (
    <View style={styles.container}>
      <NavBar title="Analytics" />
      <Text style={styles.title}>Sales (last 7 days)</Text>
      <Svg width={chartWidth} height={chartHeight} style={{ backgroundColor: '#f3f4f6', borderRadius: 12 }}>
        {dailyTotals.map((d, i) => {
          const h = Math.round((d.total / maxVal) * (chartHeight - 16));
          const x = i * (barWidth + 8) + 12;
          const y = chartHeight - h - 8;
          return <Rect key={d.key} x={x} y={y} width={barWidth} height={h} fill="#111827" rx={6} ry={6} />;
        })}
      </Svg>
      <View style={{ height: 16 }} />
      <Text style={styles.subtitle}>Totals</Text>
      <Text>Today: ₹{dailyTotals[6].total.toFixed(2)}</Text>
      <Text>Max Day: ₹{maxVal.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
});


