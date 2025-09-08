import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import { loadHistory, type HistoryRow } from '@/lib/transactions';

export default function History() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await loadHistory(100);
      if (mounted) setRows(data);
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <NavBar title="History" />
      <Text style={styles.heading}>Order & Sales History</Text>
      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.table}</Text>
            <Text>{item.date}</Text>
            <Text>Total: ₹{item.total.toFixed(2)}</Text>
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


