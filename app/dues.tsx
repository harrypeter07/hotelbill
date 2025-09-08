import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';

type Due = { id: string; name?: string; phone?: string; amount: number; table?: string; date: string; photoUri?: string };

const MOCK_DUES: Due[] = [
  { id: '1', name: 'Rahul', phone: '99999 11111', amount: 420, table: 'T2', date: new Date().toLocaleDateString() },
  { id: '2', name: 'Priya', phone: '88888 22222', amount: 250, table: 'T4', date: new Date().toLocaleDateString() },
];

export default function DuesDashboard() {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>Dues</Text>
      <FlatList
        data={MOCK_DUES}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name || 'Unknown'}</Text>
            <Text>{item.phone || '-'}</Text>
            <Text>{item.table} • {item.date}</Text>
            <Text style={styles.amount}>₹{item.amount}</Text>
            <Pressable style={styles.primary}><Text style={styles.primaryText}>Mark as Paid</Text></Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '600', padding: 16 },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, gap: 4 },
  title: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  primary: { backgroundColor: '#16a34a', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '600' },
});


