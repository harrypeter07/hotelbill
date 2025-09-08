import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';

type Table = { id: number; name: string; status: 'empty' | 'ordering' | 'occupied' };

const tables: Table[] = Array.from({ length: 6 }).map((_, i) => ({ id: i + 1, name: `T${i + 1}`, status: 'empty' }));

const StatusDot = ({ status }: { status: Table['status'] }) => {
  const color = status === 'empty' ? '#22c55e' : status === 'ordering' ? '#eab308' : '#ef4444';
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />;
};

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Tables</Text>
      <FlatList
        data={tables}
        numColumns={3}
        keyExtractor={(t) => String(t.id)}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.tile} onPress={() => router.push({ pathname: '/table', params: { id: item.id } })}>
            <Text style={styles.tileTitle}>{item.name}</Text>
            <StatusDot status={item.status} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: 20, fontWeight: '600', padding: 16 },
  tile: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileTitle: { fontSize: 18, fontWeight: '600' },
});


