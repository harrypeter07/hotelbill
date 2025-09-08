import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import NavBar from '@/components/NavBar';
import { useDuesStore } from '@/store/dues';

type Due = { id: string; name?: string; phone?: string; amount: number; table?: string; date: string; photoUri?: string };

const MOCK_DUES: Due[] = [];

export default function DuesDashboard() {
  const dues = useDuesStore((s) => s.dues.filter((d) => !d.paid));
  const markPaid = useDuesStore((s) => s.markPaid);
  return (
    <View style={{ flex: 1 }}>
      <NavBar title="Dues" />
      <Text style={styles.heading}>Dues</Text>
      <FlatList
        data={dues}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.name || 'Unknown'}</Text>
            <Text>{item.phone || '-'}</Text>
            <Text>{item.table} • {item.date}</Text>
            <Text style={styles.amount}>₹{item.amount}</Text>
            <Pressable style={styles.primary} onPress={() => markPaid(item.id)}><Text style={styles.primaryText}>Mark as Paid</Text></Pressable>
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


