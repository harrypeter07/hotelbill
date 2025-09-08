import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useOrderStore } from '@/store/order';
import { useCatalogStore } from '@/store/catalog';
import NavBar from '@/components/NavBar';
import { loadAnalytics, type AnalyticsSummary } from '@/lib/transactions';

export default function Analytics() {
  const orders = useOrderStore((s) => s.orders);
  const items = useCatalogStore((s) => s.items);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await loadAnalytics();
      if (mounted) setSummary(s);
    })();
    return () => { mounted = false; };
  }, []);
  const dailyTotals = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Array.from({ length: 7 }).map((_, i) => {
      const dayStart = now - (6 - i) * dayMs;
      const dateKey = new Date(dayStart).toDateString();
      return { key: dateKey, total: 0 };
    });
    const map = new Map(days.map((d) => [d.key, d]));
    if (summary) {
      summary.trendLast7Days.forEach((r) => {
        const bucket = map.get(r.key);
        if (bucket) bucket.total = r.total;
      });
    }
    return days;
  }, [summary]);

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
      {summary ? (
        <>
          <Text>Week Sales: ₹{summary.totals.weekSales.toFixed(2)}</Text>
          <Text>Paid Count Today: {summary.totals.paidCountToday}</Text>
          <Text>Avg Order Today: ₹{summary.totals.avgOrderToday.toFixed(2)}</Text>
          <Text>Items Sold Today: {summary.totals.itemsSoldToday}</Text>
          <Text>Tax Collected Today: ₹{summary.totals.taxCollectedToday.toFixed(2)}</Text>
          <Text>Dues Outstanding: ₹{summary.totals.duesOutstanding.toFixed(2)}</Text>
          <Text>Due Count Today: {summary.totals.dueCountToday}</Text>
          <Text>Conversion Today: {(summary.totals.conversionToday * 100).toFixed(1)}%</Text>
        </>
      ) : null}

      <View style={{ height: 16 }} />
      <Text style={styles.title}>By Category (today)</Text>
      {summary ? (
        summary.salesByCategoryToday.map((r) => (
          <View key={r.category} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>{r.category}</Text>
            <Text>₹{r.total.toFixed(2)}</Text>
          </View>
        ))
      ) : null}

      <View style={{ height: 16 }} />
      <Text style={styles.title}>Top Items (today)</Text>
      {summary ? (
        summary.topItemsToday.map((r) => (
          <View key={r.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>{r.name}</Text>
            <Text>₹{r.total.toFixed(2)}</Text>
          </View>
        ))
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
});


