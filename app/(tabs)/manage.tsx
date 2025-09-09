import { View, Text, StyleSheet, TextInput, Pressable, FlatList, ScrollView, RefreshControl } from 'react-native';
import { useState } from 'react';
import { useCatalogStore, CatalogItem, TableInfo } from '@/store/catalog';
import NavBar from '@/components/NavBar';
import { getItemImageUri } from '@/lib/images';
import { Image } from 'react-native';

export default function Manage() {
  const tables = useCatalogStore((s) => s.tables);
  const items = useCatalogStore((s) => s.items);
  const addOrUpdateTable = useCatalogStore((s) => s.addOrUpdateTable);
  const removeTable = useCatalogStore((s) => s.removeTable);
  const addOrUpdateItem = useCatalogStore((s) => s.addOrUpdateItem);
  const removeItem = useCatalogStore((s) => s.removeItem);

  const [tableName, setTableName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemHalfPrice, setItemHalfPrice] = useState('');
  // category removed per requirements
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // search removed per requirements; list will show all items

  const clearItemForm = () => {
    setItemName('');
    setItemPrice('');
    setItemHalfPrice('');
    // no category field
    setEditItemId(null);
    setError(null);
  };

  const clearTableForm = () => {
    setTableName('');
    setEditTableId(null);
  };

  const handleAddUpdateItem = () => {
    setError(null);
    const name = itemName.trim();
    const priceNum = Number(itemPrice);
    const halfNum = itemHalfPrice.trim() === '' ? null : Number(itemHalfPrice);
    
    if (!name) {
      setError('Item name is required');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Valid price required');
      return;
    }
    if (itemHalfPrice.trim() !== '' && (Number.isNaN(halfNum as number) || (halfNum as number) <= 0)) {
      setError('Half price must be a positive number');
      return;
    }
    
    addOrUpdateItem({
      id: editItemId ?? undefined,
      name,
      price: priceNum,
      half_price: halfNum,
    });
    
    clearItemForm();
  };

  const handleAddUpdateTable = () => {
    const name = tableName.trim();
    if (!name) return;
    
    addOrUpdateTable({
      id: editTableId ?? undefined,
      name
    });
    
    clearTableForm();
  };

  const handleEditItem = (item: CatalogItem) => {
    setEditItemId(item.id);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemHalfPrice(item.half_price != null ? String(item.half_price) : '');
    // no category field
    setError(null);
  };

  const handleEditTable = (table: TableInfo) => {
    setTableName(table.name);
    setEditTableId(table.id);
  };

  const hydrated = useCatalogStore((s) => s.hydrated);
  const hydrate = useCatalogStore((s) => s.hydrate);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await hydrate();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <NavBar title="Manage" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Management</Text>
        <Text style={styles.headerSubtitle}>Manage tables and menu items</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Tables Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tables ({tables.length})</Text>
          </View>
          
          {/* Add/Edit Table Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Table name (e.g., T7)"
                value={tableName}
                onChangeText={setTableName}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
              <Pressable style={styles.primaryButton} onPress={handleAddUpdateTable}>
                <Text style={styles.primaryButtonText}>
                  {editTableId ? 'Update' : 'Add'}
                </Text>
              </Pressable>
              {editTableId && (
                <Pressable style={styles.secondaryButton} onPress={clearTableForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Tables List */}
          <View style={styles.listContainer}>
            {tables.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tables added yet</Text>
                <Text style={styles.emptySubText}>Add your first table above</Text>
              </View>
            ) : (
              <FlatList
                data={tables}
                keyExtractor={(t) => t.id}
                renderItem={({ item }) => (
                  <View style={styles.listItem}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemSubtitle}>Table ID: {item.id.slice(-6)}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() => handleEditTable(item)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => removeTable(item.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Items ({items.length})</Text>
          </View>

          {/* Search removed */}

          {/* Add/Edit Item Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputColumn}>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Item name"
                  value={itemName}
                  onChangeText={setItemName}
                  style={[styles.input, styles.flexInput]}
                  placeholderTextColor="#9ca3af"
                />
                <TextInput
                  placeholder="Price"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Half price (optional)"
                  value={itemHalfPrice}
                  onChangeText={setItemHalfPrice}
                  keyboardType="numeric"
                  style={[styles.input, styles.flexInput]}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputRow}>
                {/* Category removed */}
                <Pressable style={styles.primaryButton} onPress={handleAddUpdateItem}>
                  <Text style={styles.primaryButtonText}>
                    {editItemId ? 'Update' : 'Save'}
                  </Text>
                </Pressable>
                {editItemId && (
                  <Pressable style={styles.secondaryButton} onPress={clearItemForm}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                )}
              </View>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Items List */}
          <View style={styles.listContainer}>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {'No menu items added yet'}
                </Text>
                <Text style={styles.emptySubText}>
                  {'Add your first menu item above'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <View style={styles.itemCardContent}>
                      <Image
                        source={{ uri: getItemImageUri(item.name) }}
                        style={styles.itemImage}
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price}</Text>
                        {item.half_price != null && (
                          <Text style={styles.itemHalfPrice}>Half: ₹{item.half_price}</Text>
                        )}
                        {/* category badge removed */}
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() => handleEditItem(item)}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => removeItem(item.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
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
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  inputColumn: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
    minWidth: 80,
  },
  flexInput: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000000',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#000000',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 10,
  },
  listContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 10,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 10,
  },
  separator: {
    height: 8,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  itemHalfPrice: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 2,
  },
  categoryBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#0369a1',
    letterSpacing: 0.2,
  },
});