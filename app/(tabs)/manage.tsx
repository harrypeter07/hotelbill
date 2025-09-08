import { View, Text, StyleSheet, TextInput, Pressable, FlatList } from 'react-native';
import { useState, useMemo } from 'react';
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
  const [itemCategory, setItemCategory] = useState('');
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  return (
    <View style={{ flex: 1 }}>
      <NavBar title="Manage" />
      <View style={styles.section}>
        <Text style={styles.heading}>Tables</Text>
        <View style={styles.row}>
          <TextInput placeholder="Table name (e.g., T7)" value={tableName} onChangeText={setTableName} style={styles.input} />
          <Pressable
            style={styles.primary}
            onPress={() => {
              const name = tableName.trim();
              if (!name) return;
              addOrUpdateTable({ id: editTableId ?? undefined, name });
              setTableName('');
              setEditTableId(null);
            }}
          >
            <Text style={styles.primaryText}>{editTableId ? 'Update' : 'Add'}</Text>
          </Pressable>
        </View>
        <FlatList
          data={tables}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <View style={styles.listRow}>
              <Text style={styles.listTitle}>{item.name}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={styles.secondary} onPress={() => { setTableName(item.name); setEditTableId(item.id); }}><Text style={styles.secondaryText}>Edit</Text></Pressable>
                <Pressable style={styles.danger} onPress={() => removeTable(item.id)}><Text style={styles.dangerText}>Remove</Text></Pressable>
              </View>
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Items</Text>
        <View style={styles.row}>
          <TextInput placeholder="Search items" value={search} onChangeText={setSearch} style={styles.input} />
        </View>
        <View style={styles.row}>
          <TextInput placeholder="Item name" value={itemName} onChangeText={setItemName} style={styles.input} />
          <TextInput placeholder="Price" value={itemPrice} onChangeText={setItemPrice} keyboardType="numeric" style={styles.input} />
          <TextInput placeholder="Category (e.g., Main, Breads)" value={itemCategory} onChangeText={setItemCategory} style={styles.input} />
          <Pressable style={styles.primary} onPress={() => {
            setError(null);
            const name = itemName.trim();
            const priceNum = Number(itemPrice);
            if (!name) { setError('Item name is required'); return; }
            if (Number.isNaN(priceNum) || priceNum <= 0) { setError('Valid price required'); return; }
            addOrUpdateItem({ id: editItemId ?? undefined, name, price: priceNum, category: itemCategory.trim() || undefined });
            setItemName('');
            setItemPrice('');
            setItemCategory('');
            setEditItemId(null);
          }}>
            <Text style={styles.primaryText}>{editItemId ? 'Update' : 'Save'}</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={{ uri: getItemImageUri(item.name) }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text>₹{item.price}{item.category ? ` • ${item.category}` : ''}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={styles.secondary} onPress={() => { setEditItemId(item.id); setItemName(item.name); setItemPrice(String(item.price)); setItemCategory(item.category ?? ''); }}><Text style={styles.secondaryText}>Edit</Text></Pressable>
                <Pressable style={styles.danger} onPress={() => removeItem(item.id)}><Text style={styles.dangerText}>Remove</Text></Pressable>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 16, gap: 12 },
  heading: { fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  primary: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  primaryText: { color: 'white', fontWeight: '600' },
  secondary: { backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryText: { color: '#111827', fontWeight: '700' },
  danger: { backgroundColor: '#fee2e2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  dangerText: { color: '#991b1b', fontWeight: '700' },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: 'white' },
  listTitle: { fontWeight: '700' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: 'white' },
  cardTitle: { fontWeight: '700' },
  error: { color: '#b91c1c', fontWeight: '600' },
});


