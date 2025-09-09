import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import NavBar from '@/components/NavBar';
import { loadHistory, type HistoryRow } from '@/lib/transactions';

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return { bg: '#f0fdf4', text: '#166534', border: '#22c55e' };
      case 'pending': return { bg: '#fffbeb', text: '#d97706', border: '#f59e0b' };
      case 'cancelled': return { bg: '#fef2f2', text: '#dc2626', border: '#ef4444' };
      case 'due': return { bg: '#fdf2f8', text: '#c2410c', border: '#f97316' };
      default: return { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };
    }
  };

  const colors = getStatusColor(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

// Filter Chip Component
type FilterChipProps = { label: string; isActive: boolean; onPress: () => void };
const FilterChip: React.FC<FilterChipProps & { testID?: string }> = ({ label, isActive, onPress }) => (
  <Pressable
    style={[styles.filterChip, isActive && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

// History Card Component
const HistoryCard = ({ item, index }: { item: HistoryRow; index: number }) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return `Today, ${date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.historyCard, { marginTop: index === 0 ? 0 : 4 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.tableInfo}>
          <View style={styles.tableNameContainer}>
            <Text style={styles.tableName}>{item.table}</Text>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      
      <View style={styles.cardDivider} />
      
      <View style={styles.cardFooter}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{item.total.toFixed(2)}</Text>
        </View>
        
        {item.id && (
          <View style={styles.orderIdSection}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Empty State Component
const EmptyState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <Text style={styles.emptyIconText}>📋</Text>
    </View>
    <Text style={styles.emptyTitle}>No Orders Found</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    <Pressable style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </Pressable>
  </View>
);

// Summary Stats Component
const SummaryStats = ({ data }: { data: HistoryRow[] }) => {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = data.filter(item => {
      try {
        return new Date(item.date).toDateString() === today;
      } catch {
        return false;
      }
    });

    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
    const todayRevenue = todayOrders.reduce((sum, item) => sum + item.total, 0);
    const paidOrders = data.filter(item => item.status.toLowerCase() === 'paid').length;

    return {
      totalOrders: data.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      todayRevenue,
      paidOrders
    };
  }, [data]);

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.totalOrders}</Text>
        <Text style={styles.statLabel}>Total Orders</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.todayOrders}</Text>
        <Text style={styles.statLabel}>Today's Orders</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, styles.revenueValue]}>₹{stats.totalRevenue.toFixed(0)}</Text>
        <Text style={styles.statLabel}>Total Revenue</Text>
      </View>
    </View>
  );
};

export default function History() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await loadHistory(100);
      setRows(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return rows.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        item.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchQuery, statusFilter]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = [...new Set(rows.map(item => item.status.toLowerCase()))];
    return ['all', ...uniqueStatuses];
  }, [rows]);

  const onRefresh = () => {
    loadData(true);
  };

  if (loading && rows.length === 0) {
    return (
      <View style={styles.container}>
        <NavBar title="History" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading order history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavBar title="History" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order & Sales History</Text>
          {rows.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {filteredData.length} of {rows.length} orders
            </Text>
          )}
        </View>
      </View>

      {rows.length > 0 && (
        <>
          {/* Summary Stats */}
          <SummaryStats data={rows} />

          {/* Search and Filters */}
          <View style={styles.filtersSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by table or order ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={styles.filterChipsContainer}>
              <FlatList
                data={statusOptions}
                keyExtractor={(s) => s}
                horizontal
                renderItem={({ item: status }) => (
                  <FilterChip
                    label={status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                    isActive={statusFilter === status}
                    onPress={() => setStatusFilter(status)}
                  />
                )}
                ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </View>
        </>
      )}

      {/* Orders List */}
      {filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <HistoryCard item={item} index={index} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
            />
          }
        />
      ) : (
        <EmptyState
          message={searchQuery || statusFilter !== 'all' 
            ? "No orders match your search criteria" 
            : "No orders have been placed yet"}
          onRetry={() => loadData()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  revenueValue: {
    color: '#059669',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  filtersSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tableInfo: {
    flex: 1,
    marginRight: 16,
  },
  tableNameContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountSection: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.5,
  },
  orderIdSection: {
    alignItems: 'flex-end',
  },
  orderIdLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    fontFamily: 'monospace',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});