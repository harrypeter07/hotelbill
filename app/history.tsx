import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import NavBar from '@/components/NavBar';
import { loadHistory, type HistoryRow } from '@/lib/transactions';

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'due': return { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  const colors = getStatusColor(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

// Filter Chip Component (typed as React.FC so `key` is accepted on the element)
type FilterChipProps = { label: string; isActive: boolean; onPress: () => void };
const FilterChip: React.FC<FilterChipProps> = ({ label, isActive, onPress }) => (
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
    <View style={[styles.historyCard, { marginTop: index === 0 ? 0 : 12 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.tableInfo}>
          <Text style={styles.tableName}>{item.table}</Text>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{item.total.toFixed(2)}</Text>
        </View>
        
        {/* Additional info if available */}
        {item.id && (
          <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
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
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.totalOrders}</Text>
        <Text style={styles.statLabel}>Total Orders</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.todayOrders}</Text>
        <Text style={styles.statLabel}>Today</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>₹{stats.totalRevenue.toFixed(0)}</Text>
        <Text style={styles.statLabel}>Revenue</Text>
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
          <ActivityIndicator size="large" color="#3b82f6" />
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
        <Text style={styles.headerTitle}>Order & Sales History</Text>
        {rows.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {filteredData.length} of {rows.length} orders
          </Text>
        )}
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
              {React.Children.toArray(statusOptions.map(status => (
                <FilterChip
                  label={status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  isActive={statusFilter === status}
                  onPress={() => setStatusFilter(status)}
                />
              )))}
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
              colors={['#3b82f6']}
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
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
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
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  filtersSection: {
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  orderId: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});