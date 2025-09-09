import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { useOrderStore } from '@/store/order';
import { useCatalogStore } from '@/store/catalog';
import { useMemo } from 'react';
import NavBar from '@/components/NavBar';

const { width: screenWidth } = Dimensions.get('window');
const tileWidth = (screenWidth - 56) / 3; // 3 columns with more spacing

type Table = { id: string; name: string; status: 'empty' | 'ordering' | 'occupied' };

const STATUS_CONFIG: Record<Table['status'], {
  color: string;
  dot: string;
  border: string;
  label: string;
}> = {
  empty: {
    color: '#f0fdf4',
    dot: '#22c55e',
    border: '#22c55e',
    label: 'Available',
  },
  ordering: {
    color: '#fffbeb',
    dot: '#f59e0b',
    border: '#f59e0b',
    label: 'Ordering',
  },
  occupied: {
    color: '#fef2f2',
    dot: '#ef4444',
    border: '#ef4444',
    label: 'Occupied',
  },
};

// Quick Stats Component
const QuickStats = ({ tables, orders }: { tables: Table[]; orders: any }) => {
  const stats = useMemo(() => {
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => {
      const o = orders[String(t.id)];
      return o && Object.keys(o.lines).length > 0;
    }).length;
    const availableTables = totalTables - occupiedTables;
    const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;

    return {
      total: totalTables,
      occupied: occupiedTables,
      available: availableTables,
      occupancyRate
    };
  }, [tables, orders]);

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.occupied}</Text>
        <Text style={styles.statLabel}>Occupied</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: '#22c55e' }]}>{stats.available}</Text>
        <Text style={styles.statLabel}>Available</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.occupancyRate.toFixed(0)}%</Text>
        <Text style={styles.statLabel}>Rate</Text>
      </View>
    </View>
  );
};

// Table Tile Component
const TableTile = ({ 
  table, 
  status, 
  itemCount, 
  onPress 
}: { 
  table: Table; 
  status: Table['status']; 
  itemCount: number;
  onPress: () => void;
}) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <Pressable 
      style={[
        styles.tableTile, 
        { 
          backgroundColor: config.color,
          borderColor: config.border,
          width: tileWidth,
          aspectRatio: 1
        }
      ]} 
      onPress={onPress}
    >
      <View style={styles.tileHeader}>
        <Text style={styles.tileNumber}>{table.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
      </View>
      
      <View style={styles.tileContent}>
        <Text style={styles.tileStatus}>{config.label}</Text>
      </View>
      
      {status === 'occupied' && itemCount > 0 && (
        <View style={styles.itemBadge}>
          <Text style={styles.itemBadgeText}>{itemCount} items</Text>
        </View>
      )}
      
      <View style={styles.tileFooter}>
        <Text style={styles.tileAction}>
          {status === 'empty' ? 'Tap to order' : status === 'occupied' ? 'View order' : 'Continue'}
        </Text>
      </View>
    </Pressable>
  );
};

// Status Legend Component
const StatusLegend = () => {
  const data = useMemo(() => Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, config: v })), []);
  return (
    <View style={styles.legendContainer}>
      <View style={styles.legendRow}>
        <FlatList
          data={data}
          keyExtractor={(i) => i.key}
          horizontal
          renderItem={({ item }) => (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.config.dot }]} />
              <Text style={styles.legendText}>{item.config.label}</Text>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default function Home() {
  const orders = useOrderStore((s) => s.orders);
  const catalogTables = useCatalogStore((s) => s.tables);
  
  const getTableStatus = (id: string): Table['status'] => {
    const order = orders[String(id)];
    const hasItems = order && Object.keys(order.lines).length > 0;
    return hasItems ? 'occupied' : 'empty';
  };

  const getItemCount = (id: string): number => {
    const order = orders[String(id)];
    if (!order) return 0;
    return Object.values(order.lines).reduce((sum: number, line: any) => sum + line.quantity, 0);
  };

  const tablesWithStatus = useMemo(() => {
    return catalogTables.map((t) => ({
      id: t.id,
      name: t.name,
      status: 'empty' as Table['status'],
      actualStatus: getTableStatus(t.id),
      itemCount: getItemCount(t.id)
    }));
  }, [catalogTables, orders]);

  return (
    <View style={styles.container}>
      <NavBar title="Home" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Restaurant Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage tables & orders</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <QuickStats tables={tablesWithStatus} orders={orders} />

      {/* Status Legend */}
      <StatusLegend />

      {/* Tables Grid */}
      <View style={styles.tablesSection}>
        <View style={styles.tablesSectionHeader}>
          <Text style={styles.sectionTitle}>Tables ({catalogTables.length})</Text>
        </View>
        <FlatList
          data={tablesWithStatus}
          numColumns={3}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TableTile
              table={item}
              status={item.actualStatus}
              itemCount={item.itemCount}
              onPress={() => router.push({ pathname: '/table', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.tablesGrid}
          columnWrapperStyle={styles.tableRow}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 1,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 1,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
  },
  legendContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
  },
  tablesSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tablesSectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  tablesGrid: {
    padding: 12,
    paddingBottom: 20,
  },
  tableRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tableTile: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tileContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tileIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  tileStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  itemBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  itemBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tileFooter: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  tileAction: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
});