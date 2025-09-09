import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useOrderStore } from '@/store/order';
import { useCatalogStore } from '@/store/catalog';
import NavBar from '@/components/NavBar';
import { loadAnalytics, type AnalyticsSummary } from '@/lib/transactions';

const { width: screenWidth } = Dimensions.get('window');

// Enhanced Chart Component
const BarChart = ({ data, height = 160 }: { data: Array<{ key: string; total: number }>, height?: number }) => {
  const maxVal = Math.max(1, ...data.map((d) => d.total));
  const barWidth = (screenWidth - 80) / data.length - 8;

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chartContent}>
        {React.Children.toArray(data.map((item, index) => {
          const barHeight = Math.max(4, (item.total / maxVal) * (height - 60));
          const dayName = new Date(item.key).toLocaleDateString('en', { weekday: 'short' });
          
          return (
            <View key={item.key || String(index)} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { height: barHeight, width: barWidth }]} />
                <Text style={styles.barValue}>₹{item.total > 0 ? item.total.toFixed(0) : '0'}</Text>
              </View>
              <Text style={styles.barLabel}>{dayName}</Text>
            </View>
          );
        }))}
      </View>
    </View>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, color = '#6366f1' }: { 
  title: string; 
  value: string; 
  subtitle?: string;
  color?: string;
}) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
      <View style={[styles.metricDot, { backgroundColor: color }]} />
    </View>
    <View style={styles.metricContent}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

// Category/Item Row Component
const DataRow = ({ label, value, isLast = false }: { 
  label: string; 
  value: string; 
  isLast?: boolean;
}) => (
  <View style={[styles.dataRow, !isLast && styles.dataRowBorder]}>
    <Text style={styles.dataLabel}>{label}</Text>
    <Text style={styles.dataValue}>{value}</Text>
  </View>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeleton} />
    <View style={[styles.skeleton, { width: '70%' }]} />
    <View style={[styles.skeleton, { width: '60%' }]} />
  </View>
);

export default function Analytics() {
  const orders = useOrderStore((s) => s.orders);
  const items = useCatalogStore((s) => s.items);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await loadAnalytics();
        if (mounted) {
          setSummary(s);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
        if (mounted) setLoading(false);
      }
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

  if (loading) {
    return (
      <View style={styles.container}>
        <NavBar title="Analytics" />
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <NavBar title="Analytics" />
      
      {/* Header Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Revenue"
            value={`₹${dailyTotals[6]?.total.toFixed(2) || '0.00'}`}
            subtitle="Today's sales"
            color="#10b981"
          />
          <MetricCard
            title="Orders"
            value={summary?.totals.paidCountToday?.toString() || '0'}
            subtitle="Completed"
            color="#6366f1"
          />
        </View>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Avg Order"
            value={`₹${summary?.totals.avgOrderToday.toFixed(2) || '0.00'}`}
            subtitle="Per transaction"
            color="#f59e0b"
          />
          <MetricCard
            title="Items Sold"
            value={summary?.totals.itemsSoldToday?.toString() || '0'}
            subtitle="Units today"
            color="#ef4444"
          />
        </View>
      </View>

      {/* Sales Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Trend (7 days)</Text>
        <BarChart data={dailyTotals} />
      </View>

      {/* Additional Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.card}>
          <MetricCard
            title="Weekly Sales"
            value={`₹${summary?.totals.weekSales.toFixed(2) || '0.00'}`}
            color="#8b5cf6"
          />
          <MetricCard
            title="Tax Collected"
            value={`₹${summary?.totals.taxCollectedToday.toFixed(2) || '0.00'}`}
            subtitle="Today"
            color="#06b6d4"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${(((summary?.totals.conversionToday ?? 0) * 100).toFixed(1))}%`}
            subtitle="Success rate"
            color="#84cc16"
          />
        </View>
      </View>

      {/* Outstanding Dues */}
      {summary && summary.totals.duesOutstanding > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outstanding</Text>
          <View style={styles.card}>
            <MetricCard
              title="Dues Outstanding"
              value={`₹${summary.totals.duesOutstanding.toFixed(2)}`}
              subtitle={`${summary.totals.dueCountToday} pending orders`}
              color="#f97316"
            />
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      {summary && summary.salesByCategoryToday.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales by Category</Text>
          <View style={styles.card}>
            {React.Children.toArray(summary.salesByCategoryToday.map((item, index) => (
              <DataRow
                label={item.category}
                value={`₹${item.total.toFixed(2)}`}
                isLast={index === summary.salesByCategoryToday.length - 1}
              />
            )))}
          </View>
        </View>
      )}

      {/* Top Items */}
      {summary && summary.topItemsToday.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          <View style={styles.card}>
            {React.Children.toArray(summary.topItemsToday.map((item, index) => (
              <DataRow
                label={item.name}
                value={`₹${item.total.toFixed(2)}`}
                isLast={index === summary.topItemsToday.length - 1}
              />
            )))}
          </View>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    backgroundColor: '#6366f1',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dataRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dataLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeleton: {
    height: 60,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
  },
});