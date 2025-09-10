import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert, ActivityIndicator, RefreshControl, Modal, Image, ScrollView } from 'react-native';
import RobustImage from '@/components/RobustImage';
import NavBar from '@/components/NavBar';
import { useDuesStore } from '@/store/dues';
import React, { useMemo, useState } from 'react';
import { loadHistory } from '@/lib/transactions';

type Due = { 
  id: string; 
  name?: string; 
  phone?: string; 
  amount: number; 
  table?: string; 
  date: string; 
  photoUri?: string;
  paid?: boolean;
};

// Summary Stats Component
const DuesSummary = ({ dues }: { dues: Due[] }) => {
  const stats = useMemo(() => {
    const totalAmount = dues.reduce((sum, due) => sum + due.amount, 0);
    const totalCount = dues.length;
    const today = new Date().toDateString();
    const todayDues = dues.filter(due => {
      try {
        return new Date(due.date).toDateString() === today;
      } catch {
        return false;
      }
    });
    const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    return {
      totalAmount,
      totalCount,
      todayCount: todayDues.length,
      avgAmount
    };
  }, [dues]);

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={[styles.summaryValue, { color: '#ef4444' }]}>₹{stats.totalAmount.toFixed(0)}</Text>
        <Text style={styles.summaryLabel}>Total Outstanding</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{stats.totalCount}</Text>
        <Text style={styles.summaryLabel}>Pending Orders</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryCard}>
        <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>₹{stats.avgAmount.toFixed(0)}</Text>
        <Text style={styles.summaryLabel}>Avg Amount</Text>
      </View>
    </View>
  );
};

// Sort Options Component
const SortOptions = ({ 
  sortBy, 
  setSortBy, 
  sortOrder, 
  setSortOrder 
}: {
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}) => (
  <View style={styles.sortContainer}>
    <Text style={styles.sortLabel}>Sort by:</Text>
    <View style={styles.sortButtons}>
      {['amount', 'date', 'name'].map(option => (
        <Pressable
          key={option}
          style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
          onPress={() => setSortBy(option)}
        >
          <Text style={[styles.sortButtonText, sortBy === option && styles.sortButtonTextActive]}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
    <Pressable
      style={styles.orderButton}
      onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
    >
      <Text style={styles.orderButtonText}>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
    </Pressable>
  </View>
);

// Detailed Bill View Modal
const BillDetailModal = ({ 
  visible, 
  onClose, 
  bill 
}: { 
  visible: boolean; 
  onClose: () => void; 
  bill: any; 
}) => {
  console.log('🎭 BillDetailModal rendered with:', {
    visible,
    bill: bill ? JSON.stringify(bill, null, 2) : 'null'
  });
  
  if (!bill) {
    console.log('❌ No bill data provided to modal');
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Bill Details</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Customer Info */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{bill.customer_name || 'Walk-in Customer'}</Text>
            </View>
            {bill.customer_phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{bill.customer_phone}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Table:</Text>
              <Text style={styles.detailValue}>{bill.table_id || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{new Date(bill.created_at).toLocaleString()}</Text>
            </View>
          </View>

          {/* Order Items */}
          {bill.items && bill.items.length > 0 && (
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
              {bill.items.map((item: any, index: number) => {
                return (
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
                );
              })}
            </View>
          )}

          {/* Bill Summary */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Bill Summary</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subtotal:</Text>
              <Text style={styles.detailValue}>₹{bill.subtotal?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tax:</Text>
              <Text style={styles.detailValue}>₹{bill.tax?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Discount:</Text>
              <Text style={styles.detailValue}>₹{bill.discount?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₹{bill.total?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Due Card Component
const DueCard = ({ 
  item, 
  onMarkPaid, 
  onViewDetails,
  loading 
}: { 
  item: Due; 
  onMarkPaid: (id: string) => void;
  onViewDetails: (item: Due) => void;
  loading: boolean;
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {
      return dateStr;
    }
  };

  const getDaysOverdue = (dateStr: string) => {
    try {
      const dueDate = new Date(dateStr);
      const today = new Date();
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const daysOverdue = getDaysOverdue(item.date);
  const isUrgent = daysOverdue > 7;

  return (
    <Pressable 
      style={[styles.dueCard, isUrgent && styles.urgentCard]}
      onPress={() => onViewDetails(item)}
    >
      {isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>⚠️ {daysOverdue} days overdue</Text>
        </View>
      )}
      
      <View style={styles.cardContent}>
        {/* Image on the left */}
        {item.photoUri && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.photoUri }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                {item.name || 'Walk-in Customer'}
              </Text>
              {item.phone && (
                <Text style={styles.customerPhone}>📞 {item.phone}</Text>
              )}
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountValue}>₹{item.amount.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Table:</Text>
              <Text style={styles.detailValue}>{item.table || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
            </View>
            {item.id && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order ID:</Text>
                <Text style={styles.detailValue}>#{item.id.slice(-6).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable 
          style={styles.payButton}
          onPress={() => onMarkPaid(item.id)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.payButtonText}>Mark as Paid</Text>
          )}
        </Pressable>
        
        {item.phone && (
          <Pressable style={styles.callButton}>
            <Text style={styles.callButtonText}>📞 Call</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

// Empty State Component
const EmptyState = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <Text style={styles.emptyIconText}>💰</Text>
    </View>
    <Text style={styles.emptyTitle}>No Outstanding Dues</Text>
    <Text style={styles.emptyMessage}>
      Great! All customers have settled their payments.
    </Text>
  </View>
);

export default function DuesDashboard() {
  const allDues = useDuesStore((s) => s.dues);
  const markPaid = useDuesStore((s) => s.markPaid);
  const hydrate = useDuesStore((s) => s.hydrate);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showBillModal, setShowBillModal] = useState(false);

  const dues = useMemo(() => allDues.filter((d) => !d.paid), [allDues]);

  React.useEffect(() => { void hydrate(); }, [hydrate]);
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await hydrate();
    } finally {
      setRefreshing(false);
    }
  }, [hydrate]);

  const filteredAndSortedDues = useMemo(() => {
    let filtered = dues.filter(due => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (due.name?.toLowerCase().includes(searchLower)) ||
        (due.phone?.includes(searchQuery)) ||
        (due.table?.toLowerCase().includes(searchLower)) ||
        (due.id.toLowerCase().includes(searchLower))
      );
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [dues, searchQuery, sortBy, sortOrder]);

  const handleMarkPaid = async (dueId: string) => {
    const due = dues.find(d => d.id === dueId);
    if (!due) return;

    Alert.alert(
      'Confirm Payment',
      `Mark ₹${due.amount.toFixed(2)} from ${due.name || 'customer'} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          style: 'default',
          onPress: async () => {
            setLoadingId(dueId);
            try {
              await markPaid(dueId);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as paid. Please try again.');
            } finally {
              setLoadingId(null);
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = async (due: Due) => {
    console.log('🔍 Opening due details for:', due);
    console.log('📊 Due data structure:', JSON.stringify(due, null, 2));
    
    try {
      // Load detailed bill information
      console.log('📚 Loading history data...');
      const history = await loadHistory();
      console.log('📚 History data loaded:', history.length, 'entries');
      console.log('📚 History sample:', history.slice(0, 2));
      
      // Match using billId if present, otherwise fallback to bill id
      const targetBillId = (due as any).billId || due.id;
      const bill = history.find(h => h.id === targetBillId);
      console.log('🔍 Looking for bill with ID:', targetBillId);
      console.log('🔍 Found bill:', bill ? 'YES' : 'NO');
      
      if (bill) {
        console.log('✅ Using detailed bill data:', JSON.stringify(bill, null, 2));
        try {
          // Also load order items for this bill
          // Defer import to avoid circular deps
          const { loadOrderItems } = await import('@/lib/transactions');
          const items = await loadOrderItems(bill.order_id);
          console.log('🍽️ Loaded items for bill:', items.length);
          setSelectedBill({ ...bill, items, created_at: bill.date, table_id: bill.table });
        } catch (e) {
          console.log('⚠️ Could not load items for bill, proceeding without items');
          setSelectedBill({ ...bill, created_at: bill.date, table_id: bill.table });
        }
      } else {
        console.log('⚠️ No detailed bill found, using due data:', JSON.stringify(due, null, 2));
        setSelectedBill(due);
      }
      setShowBillModal(true);
    } catch (error) {
      console.error('❌ Error loading history:', error);
      // Fallback to basic due info
      console.log('🔄 Fallback to due data:', JSON.stringify(due, null, 2));
      setSelectedBill(due);
      setShowBillModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <NavBar title="Dues Management" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Outstanding Dues</Text>
          <Text style={styles.headerSubtitle}>
            {filteredAndSortedDues.length} of {dues.length} dues
          </Text>
        </View>

        {dues.length > 0 && (
          <>
            {/* Summary Stats */}
            <DuesSummary dues={dues} />

            {/* Search and Sort */}
            <View style={styles.controlsContainer}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, phone, table, or order ID..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <SortOptions
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
            </View>
          </>
        )}

        {/* Dues List */}
        {filteredAndSortedDues.length > 0 ? (
          <View style={{ paddingHorizontal: 16 }}>
            {filteredAndSortedDues.map((item) => (
              <DueCard
                key={item.id}
                item={item}
                onMarkPaid={handleMarkPaid}
                onViewDetails={handleViewDetails}
                loading={loadingId === item.id}
              />
            ))}
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      {/* Bill Detail Modal */}
      <BillDetailModal
        visible={showBillModal}
        onClose={() => setShowBillModal(false)}
        bill={selectedBill}
      />
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
  summaryContainer: {
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
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  controlsContainer: {
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  sortButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  orderButton: {
    backgroundColor: '#f8fafc',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  listContainer: {
    padding: 16,
  },
  dueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  urgentBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  urgentText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ef4444',
  },
  cardDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  payButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  payButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  callButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 14,
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
    lineHeight: 20,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
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
  // duplicate removed
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