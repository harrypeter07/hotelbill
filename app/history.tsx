import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, RefreshControl, Modal, ScrollView, Image } from 'react-native';
import RobustImage from '@/components/RobustImage';
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
const HistoryCard = ({ item, index, onViewOrder }: { item: HistoryRow; index: number; onViewOrder?: (order: HistoryRow) => void }) => {
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
    <Pressable 
      style={[styles.historyCard, { marginTop: index === 0 ? 0 : 4 }]}
      onPress={() => onViewOrder && onViewOrder(item)}
    >
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
    </Pressable>
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
  const [selectedOrder, setSelectedOrder] = useState<HistoryRow | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

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

  const handleViewOrder = (order: HistoryRow) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} tintColor="#2563eb" />}
        showsVerticalScrollIndicator={false}
      >
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
                {statusOptions.map((status) => (
                  <FilterChip
                    key={status}
                    label={status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                    isActive={statusFilter === status}
                    onPress={() => setStatusFilter(status)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Orders List */}
        {filteredData.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredData.map((item, index) => (
              <HistoryCard key={item.id} item={item} index={index} onViewOrder={handleViewOrder} />
            ))}
          </View>
        ) : (
          <EmptyState
            message={searchQuery || statusFilter !== 'all' 
              ? "No orders match your search criteria" 
              : "No orders have been placed yet"}
            onRetry={() => loadData()}
          />
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <OrderDetailModal
        visible={showOrderModal}
        order={selectedOrder}
        onClose={closeOrderModal}
      />
    </View>
  );
}

// Order Detail Modal Component
const OrderDetailModal = ({ 
  visible, 
  order, 
  onClose 
}: { 
  visible: boolean; 
  order: HistoryRow | null; 
  onClose: () => void; 
}) => {
  console.log('🎭 OrderDetailModal rendered with:', {
    visible,
    order: order ? JSON.stringify(order, null, 2) : 'null'
  });
  
  if (!order) {
    console.log('❌ No order data provided to modal');
    return null;
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const [items, setItems] = React.useState<Array<{ name: string; quantity: number; price: number }>>([]);
  const [itemsLoading, setItemsLoading] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchItems = async () => {
      if (!order?.order_id) return;
      try {
        setItemsLoading(true);
        const { loadOrderItems } = await import('@/lib/transactions');
        const rows = await loadOrderItems(order.order_id);
        if (isMounted) setItems(rows);
      } catch (e) {
        console.log('⚠️ Failed to load order items for history modal:', e);
      } finally {
        if (isMounted) setItemsLoading(false);
      }
    };
    fetchItems();
    return () => { isMounted = false; };
  }, [order?.order_id]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Order Details</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Order Info */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValue}>#{order.id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Table:</Text>
              <Text style={styles.detailValue}>{order.table}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <StatusBadge status={order.status} />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(order.date)}</Text>
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Item</Text>
              <Text style={styles.tableHeaderText}>Qty</Text>
              <Text style={styles.tableHeaderText}>Price</Text>
              <Text style={styles.tableHeaderText}>Total</Text>
            </View>
            
            {/* Table Rows */}
            {itemsLoading ? (
              <Text style={{ textAlign: 'center', color: '#64748b' }}>Loading items...</Text>
            ) : items.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#64748b' }}>No items found for this order.</Text>
            ) : (
              items.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.tableRow}>
                  <View style={styles.itemCell}>
                    <View style={styles.itemImageContainer}>
                      <RobustImage
                        itemName={item.name}
                        style={styles.itemImage}
                        fallbackText={item.name?.charAt(0)?.toUpperCase?.() || '?'}
                      />
                    </View>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.quantityCell}>{item.quantity}</Text>
                  <Text style={styles.priceCell}>₹{Number(item.price).toFixed(2)}</Text>
                  <Text style={styles.totalCell}>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subtotal:</Text>
              <Text style={styles.detailValue}>₹{(order.total * 0.9).toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tax (10%):</Text>
              <Text style={styles.detailValue}>₹{(order.total * 0.1).toFixed(2)}</Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  // Table styles
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemCell: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  quantityCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  priceCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  totalCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
});