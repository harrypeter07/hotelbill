import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { useOrderStore } from '@/store/order';
import { useMemo } from 'react';
import NavBar from '@/components/NavBar';

const { width: screenWidth } = Dimensions.get('window');
const tileWidth = (screenWidth - 48) / 3; // 3 columns with padding

type Table = { id: number; name: string; status: 'empty' | 'ordering' | 'occupied' };

const STATUS_CONFIG: Record<Table['status'], {
  color: string;
  dot: string;
  border: string;
  label: string;
  icon: string;
}> = {
  empty: {
    color: '#f0fdf4',
    dot: '#22c55e',
    border: '#bbf7d0',
    label: 'Available',
    icon: '✅'
  },
  ordering: {
    color: '#fffbeb',
    dot: '#f59e0b',
    border: '#fde68a',
    label: 'Ordering',
    icon: '📝'
  },
  occupied: {
    color: '#fef2f2',
    dot: '#ef4444',
    border: '#fecaca',
    label: 'Occupied',
    icon: '👥'
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
        <Text style={styles.statLabel}>Total Tables</Text>
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
        <Text style={styles.statLabel}>Occupancy</Text>
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
          width: tileWidth
        }
      ]} 
      onPress={onPress}
    >
      <View style={styles.tileHeader}>
        <Text style={styles.tileNumber}>{table.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
      </View>
      
      <View style={styles.tileContent}>
        <Text style={styles.tileIcon}>{config.icon}</Text>
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
const StatusLegend = () => (
  <View style={styles.legendContainer}>
    <Text style={styles.legendTitle}>Table Status</Text>
    <View style={styles.legendRow}>
      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
        <View key={status} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: config.dot }]} />
          <Text style={styles.legendText}>{config.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

// Quick Actions Component
const QuickActions = () => (
  <View style={styles.quickActionsContainer}>
    <Text style={styles.sectionTitle}>Quick Actions</Text>
    <View style={styles.actionsRow}>
      <Pressable 
        style={styles.actionButton}
        onPress={() => router.push('/(tabs)/analytics')}
      >
        <Text style={styles.actionIcon}>📊</Text>
        <Text style={styles.actionText}>Analytics</Text>
      </Pressable>
      
      <Pressable 
        style={styles.actionButton}
        onPress={() => router.push('/(tabs)/history')}
      >
        <Text style={styles.actionIcon}>📋</Text>
        <Text style={styles.actionText}>History</Text>
      </Pressable>
      
      <Pressable 
        style={styles.actionButton}
        onPress={() => router.push('/(tabs)/catalog')}
      >
        <Text style={styles.actionIcon}>📦</Text>
        <Text style={styles.actionText}>Menu</Text>
      </Pressable>
    </View>
  </View>
);

const tables: Table[] = Array.from({ length: 12 }).map((_, i) => ({ 
  id: i + 1, 
  name: `T${i + 1}`, 
  status: 'empty' as Table['status']
}));

export default function Home() {
  const orders = useOrderStore((s) => s.orders);
  
  const getTableStatus = (id: number): Table['status'] => {
    const order = orders[String(id)];
    const hasItems = order && Object.keys(order.lines).length > 0;
    return hasItems ? 'occupied' : 'empty';
  };

  const getItemCount = (id: number): number => {
    const order = orders[String(id)];
    if (!order) return 0;
    return Object.values(order.lines).reduce((sum: number, line: any) => sum + line.quantity, 0);
  };

  const tablesWithStatus = useMemo(() => {
    return tables.map(table => ({
      ...table,
      actualStatus: getTableStatus(table.id),
      itemCount: getItemCount(table.id)
    }));
  }, [orders]);

  return (
    <View style={styles.container}>
      <NavBar title="Home" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your tables and orders</Text>
      </View>

      {/* Quick Stats */}
      <QuickStats tables={tablesWithStatus} orders={orders} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Status Legend */}
      <StatusLegend />

      {/* Tables Grid */}
      <View style={styles.tablesSection}>
        <Text style={styles.sectionTitle}>Tables ({tables.length})</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  quickActionsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  legendContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tablesSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tablesGrid: {
    padding: 16,
  },
  tableRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableTile: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tileIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tileStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
  },
  itemBadge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 4,
  },
  itemBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  tileFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  tileAction: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
});