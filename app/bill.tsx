import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert, ScrollView, Dimensions } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useOrderStore } from '@/store/order';
import NavBar from '@/components/NavBar';
import { savePaidBill } from '@/lib/transactions';

const { width: screenWidth } = Dimensions.get('window');

// Line Item Component
const LineItem = ({ item, index, totalItems }: { 
  item: any; 
  index: number; 
  totalItems: number;
}) => (
  <View style={[styles.lineItem, index === totalItems - 1 && styles.lastLineItem]}>
    <View style={styles.itemDetails}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemInfo}>
        ₹{item.price.toFixed(2)} × {item.quantity}
      </Text>
    </View>
    <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
  </View>
);

// Calculation Row Component
const CalculationRow = ({ 
  label, 
  value, 
  isInput = false, 
  inputValue = '', 
  onInputChange, 
  isTotal = false,
  suffix = ''
}: {
  label: string;
  value?: string;
  isInput?: boolean;
  inputValue?: string;
  onInputChange?: (text: string) => void;
  isTotal?: boolean;
  suffix?: string;
}) => (
  <View style={[styles.calculationRow, isTotal && styles.totalRow]}>
    <Text style={[styles.calculationLabel, isTotal && styles.totalLabel]}>
      {label}
    </Text>
    {isInput ? (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.percentInput}
          keyboardType="numeric"
          value={inputValue}
          onChangeText={onInputChange}
          placeholder="0"
          maxLength={5}
        />
        <Text style={styles.inputSuffix}>{suffix}</Text>
      </View>
    ) : (
      <Text style={[styles.calculationValue, isTotal && styles.totalValue]}>
        {value}
      </Text>
    )}
  </View>
);

// Action Button Component
const ActionButton = ({ 
  title, 
  onPress, 
  variant = 'primary',
  loading = false 
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}) => (
  <Pressable
    style={[
      styles.actionButton,
      variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
      loading && styles.buttonDisabled
    ]}
    onPress={onPress}
    disabled={loading}
  >
    <Text style={[
      styles.buttonText,
      variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
    ]}>
      {loading ? 'Processing...' : title}
    </Text>
  </Pressable>
);

export default function Bill() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tableId = String(id);
  const tableOrder = useOrderStore((s) => s.orders[tableId]);
  const setAdj = useOrderStore((s) => s.setBillAdjustments);
  const clear = useOrderStore((s) => s.clearTable);

  const lines = useMemo(() => (tableOrder ? Object.values(tableOrder.lines) : []), [tableOrder]);

  const [taxPct, setTaxPct] = useState('5');
  const [discountPct, setDiscountPct] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAdj(tableId, Number(taxPct) || 0, Number(discountPct) || 0);
  }, [tableId, taxPct, discountPct, setAdj]);

  const { subtotal, tax, discount, total, itemCount } = useMemo(() => {
    const sb = lines.reduce((s, it) => s + it.price * it.quantity, 0);
    const t = (sb * (Number(taxPct) || 0)) / 100;
    const d = (sb * (Number(discountPct) || 0)) / 100;
    const ic = lines.reduce((s, it) => s + it.quantity, 0);
    return { 
      subtotal: sb, 
      tax: t, 
      discount: d, 
      total: Math.max(0, sb + t - d),
      itemCount: ic 
    };
  }, [lines, taxPct, discountPct]);

  const handlePaidPress = async () => {
    if (total <= 0) {
      Alert.alert('Error', 'Total amount must be greater than zero');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Process payment of ₹${total.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await savePaidBill({
                tableId,
                waiterId: null,
                lines,
                taxPct: Number(taxPct) || 0,
                discountPct: Number(discountPct) || 0,
              });
              clear(tableId);
              router.replace('/(tabs)/home');
            } catch (error) {
              Alert.alert('Error', 'Failed to process payment. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDuePress = () => {
    router.push('/due');
  };

  if (!tableOrder || lines.length === 0) {
    return (
      <View style={styles.container}>
        <NavBar title="Bill" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Items Found</Text>
          <Text style={styles.emptySubtitle}>This table has no items to bill</Text>
          <Pressable style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavBar title="Bill" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.billTitle}>Table {tableId} Bill</Text>
        <Text style={styles.itemSummary}>{itemCount} items • {lines.length} types</Text>
      </View>

      {/* Items List */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.itemsContainer}>
          <FlatList
            data={lines}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <LineItem item={item} index={index} totalItems={lines.length} />
            )}
            showsVerticalScrollIndicator={false}
            bounces={false}
          />
        </View>
      </View>

      {/* Calculations */}
      <View style={styles.calculationsSection}>
        <Text style={styles.sectionTitle}>Bill Summary</Text>
        <View style={styles.calculationsContainer}>
          <CalculationRow
            label="Subtotal"
            value={`₹${subtotal.toFixed(2)}`}
          />
          
          <CalculationRow
            label="Tax"
            isInput={true}
            inputValue={taxPct}
            onInputChange={setTaxPct}
            suffix="%"
          />
          
          <CalculationRow
            label="Discount"
            isInput={true}
            inputValue={discountPct}
            onInputChange={setDiscountPct}
            suffix="%"
          />

          <View style={styles.divider} />
          
          <CalculationRow
            label="Total Amount"
            value={`₹${total.toFixed(2)}`}
            isTotal={true}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <ActionButton
          title={`Mark as Paid • ₹${total.toFixed(2)}`}
          onPress={handlePaidPress}
          variant="primary"
          loading={loading}
        />
        <ActionButton
          title="Mark as Due Payment"
          onPress={handleDuePress}
          variant="secondary"
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
  billTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemSummary: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  itemsSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  itemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  lastLineItem: {
    borderBottomWidth: 0,
  },
  itemDetails: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemInfo: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  calculationsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  calculationsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  totalRow: {
    paddingVertical: 16,
  },
  calculationLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  calculationValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 40,
  },
  percentInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
    minWidth: 40,
  },
  inputSuffix: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});