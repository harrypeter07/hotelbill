import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import NavBar from '@/components/NavBar';
import { useDuesStore } from '@/store/dues';
import { useMemo, useState } from 'react';

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

// Due Card Component
const DueCard = ({ 
  item, 
  onMarkPaid, 
  loading 
}: { 
  item: Due; 
  onMarkPaid: (id: string) => void;
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
    <View style={[styles.dueCard, isUrgent && styles.urgentCard]}>
      {isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>⚠️ {daysOverdue} days overdue</Text>
        </View>
      )}
      
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
    </View>
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const dues = useMemo(() => allDues.filter((d) => !d.paid), [allDues]);

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
              // Simulate async operation
              await new Promise(resolve => setTimeout(resolve, 800));
              markPaid(dueId);
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

  return (
    <View style={styles.container}>
      <NavBar title="Dues Management" />
      
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
        <FlatList
          data={filteredAndSortedDues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DueCard
              item={item}
              onMarkPaid={handleMarkPaid}
              loading={loadingId === item.id}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}
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
});