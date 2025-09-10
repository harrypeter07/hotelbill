import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import NavBar from '@/components/NavBar';
import { useDuesStore } from '@/store/dues';
import { useOrderStore } from '@/store/order';
import { saveDueBill } from '@/lib/transactions';

// Input Field Component
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  required = false,
  error = false,
  errorMessage = ''
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor="#9ca3af"
    />
    {error && errorMessage && (
      <Text style={styles.errorText}>{errorMessage}</Text>
    )}
  </View>
);

// Photo Capture Component
const PhotoCapture = ({
  photoUri,
  onCapture,
  onRemove
}: {
  photoUri: string | null;
  onCapture: () => void;
  onRemove: () => void;
}) => (
  <View style={styles.photoSection}>
    <Text style={styles.photoLabel}>Customer Photo (Optional)</Text>
    <Text style={styles.photoHint}>Take a photo for record keeping</Text>
    
    {photoUri ? (
      <View style={styles.photoContainer}>
        <Image source={{ uri: photoUri }} style={styles.photoImage} />
        <View style={styles.photoOverlay}>
          <Pressable style={styles.photoAction} onPress={onCapture}>
            <Text style={styles.photoActionText}>📷 Retake</Text>
          </Pressable>
          <Pressable style={styles.photoAction} onPress={onRemove}>
            <Text style={styles.photoActionText}>🗑️ Remove</Text>
          </Pressable>
        </View>
      </View>
    ) : (
      <Pressable style={styles.photoPlaceholder} onPress={onCapture}>
        <Text style={styles.photoPlaceholderIcon}>📷</Text>
        <Text style={styles.photoPlaceholderText}>Tap to capture photo</Text>
      </Pressable>
    )}
  </View>
);

// Order Summary Component
const OrderSummary = ({ tableOrder, tableId }: { tableOrder: any; tableId: string }) => {
  const orderLines = Object.values(tableOrder.lines);
  const subtotal = orderLines.reduce((sum: number, line: any) => sum + (line.price * line.quantity), 0);
  const tax = (subtotal * tableOrder.taxPct) / 100;
  const discount = (subtotal * tableOrder.discountPct) / 100;
  const total = subtotal + tax - discount;

  return (
    <View style={styles.orderSummary}>
      <Text style={styles.summaryTitle}>Order Details - Table {tableId}</Text>
      
      <View style={styles.summaryItems}>
        {React.Children.toArray(orderLines.map((line: any) => (
          <View style={styles.summaryItem}>
            <Text style={styles.itemName}>{line.name} × {line.quantity}</Text>
            <Text style={styles.itemPrice}>₹{(line.price * line.quantity).toFixed(2)}</Text>
          </View>
        )))}
      </View>

      <View style={styles.summaryCalculations}>
        <View style={styles.calculationRow}>
          <Text style={styles.calculationLabel}>Subtotal</Text>
          <Text style={styles.calculationValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        
        {tableOrder.taxPct > 0 && (
          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Tax ({tableOrder.taxPct}%)</Text>
            <Text style={styles.calculationValue}>₹{tax.toFixed(2)}</Text>
          </View>
        )}
        
        {tableOrder.discountPct > 0 && (
          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Discount ({tableOrder.discountPct}%)</Text>
            <Text style={[styles.calculationValue, { color: '#ef4444' }]}>-₹{discount.toFixed(2)}</Text>
          </View>
        )}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

export default function DuePayment() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const addDue = useDuesStore((s) => s.addDue);
  const orders = useOrderStore((s) => s.orders);
  const clearTable = useOrderStore((s) => s.clearTable);

  // Find the most recent table with items
  const { tableId, tableOrder, total } = useMemo(() => {
    const tableWithItems = Object.keys(orders).find((k) => Object.keys(orders[k].lines).length > 0);
    const order = tableWithItems ? orders[tableWithItems] : undefined;
    
    let calculatedTotal = 0;
    if (order) {
      const orderLines = Object.values(order.lines);
      const subtotal = orderLines.reduce((sum: number, line: any) => sum + (line.price * line.quantity), 0);
      const tax = (subtotal * order.taxPct) / 100;
      const discount = (subtotal * order.discountPct) / 100;
      calculatedTotal = subtotal + tax - discount;
    }
    
    return {
      tableId: tableWithItems,
      tableOrder: order,
      total: calculatedTotal
    };
  }, [orders]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!tableId || !tableOrder) {
      Alert.alert('Error', 'No active order found. Please add items to a table first.');
      return false;
    }

    if (phone && !/^\d{10}$/.test(phone.replace(/[^\d]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const capturePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({ 
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3]
      });
      
      if (!res.canceled && res.assets[0]) {
        setPhotoUri(res.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setPhotoUri(null) }
      ]
    );
  };

  const onSave = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirm Due Payment',
      `Save order of ₹${total.toFixed(2)} as due payment?${name ? `\nCustomer: ${name}` : ''}${phone ? `\nPhone: ${phone}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save as Due',
          onPress: async () => {
            setLoading(true);
            try {
              if (tableOrder && tableId) {
                const dueBillData = {
                  tableId,
                  lines: Object.values(tableOrder.lines),
                  taxPct: tableOrder.taxPct || 0,
                  discountPct: tableOrder.discountPct || 0,
                  dueName: name || null,
                  duePhone: phone || null,
                  photoUri: photoUri || null,
                };
                console.log('💾 Saving due bill with data:', JSON.stringify(dueBillData, null, 2));
                
                await saveDueBill(dueBillData);
                console.log('✅ Due bill saved successfully');

                addDue({ 
                  name: name || undefined, 
                  phone: phone || undefined, 
                  amount: total, 
                  table: `Table ${tableId}`, 
                  photoUri: photoUri || undefined
                });

                clearTable(tableId);
              }
              
              Alert.alert('Success', 'Due payment saved successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/dues') }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to save due payment. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!tableId || !tableOrder) {
    return (
      <View style={styles.container}>
        <NavBar title="Due Payment" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Active Orders</Text>
          <Text style={styles.emptyMessage}>
            Please add items to a table before creating a due payment.
          </Text>
          <Pressable 
            style={styles.emptyButton}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.emptyButtonText}>Go to Tables</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavBar title="Due Payment" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Due Payment</Text>
          <Text style={styles.headerSubtitle}>Record customer details for future payment</Text>
        </View>

        {/* Order Summary */}
        <OrderSummary tableOrder={tableOrder} tableId={tableId} />

        {/* Customer Details */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <InputField
            label="Customer Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter customer name (optional)"
          />

          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter 10-digit phone number"
            keyboardType="phone-pad"
            error={!!errors.phone}
            errorMessage={errors.phone}
          />

          <PhotoCapture
            photoUri={photoUri}
            onCapture={capturePhoto}
            onRemove={removePhoto}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable 
            style={styles.saveButton}
            onPress={onSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>💾 Save as Due Payment</Text>
                <Text style={styles.saveButtonSubtext}>₹{total.toFixed(2)}</Text>
              </>
            )}
          </Pressable>

          <Pressable 
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
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
  orderSummary: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  summaryItems: {
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemName: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryCalculations: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ef4444',
  },
  customerSection: {
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
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  photoSection: {
    marginTop: 8,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  photoHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  photoAction: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  photoPlaceholder: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButtonSubtext: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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