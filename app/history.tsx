import { View, Text, StyleSheet, FlatList } from 'react-native';
import NavBar from '@/components/NavBar';

type HistoryItem = { id: string; table: string; waiter: string; date: string; total: number; status: 'paid' | 'due_paid' };

const MOCK_HISTORY: HistoryItem[] = [
  { id: 'h1', table: 'T1', waiter: 'Aman', date: new Date().toLocaleDateString(), total: 580, status: 'paid' },
  { id: 'h2', table: 'T3', waiter: 'Neha', date: new Date().toLocaleDateString(), total: 260, status: 'due_paid' },
];

export default function History() {
  return (
    <View style={{ flex: 1 }}>
      <NavBar title="History" />
      <Text style={styles.heading}>Order & Sales History</Text>
      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.table} • {item.waiter}</Text>
            <Text>{item.date}</Text>
            <Text>Total: ₹{item.total}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '600', padding: 16 },
  card: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, gap: 4 },
  title: { fontSize: 16, fontWeight: '600' },
});


