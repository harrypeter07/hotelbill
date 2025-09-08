import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useOrderStore } from '@/store/order';
import NavBar from '@/components/NavBar';

type Table = { id: number; name: string; status: 'empty' | 'ordering' | 'occupied' };

const STATUS_COLOR: Record<Table['status'], string> = {
  empty: '#dcfce7',
  ordering: '#fef9c3',
  occupied: '#fee2e2',
};

const STATUS_DOT: Record<Table['status'], string> = {
  empty: '#22c55e',
  ordering: '#eab308',
  occupied: '#ef4444',
};

const mockStatuses: Table['status'][] = ['empty', 'ordering', 'occupied', 'empty', 'occupied', 'ordering'];
const tables: Table[] = Array.from({ length: 6 }).map((_, i) => ({ id: i + 1, name: `T${i + 1}`, status: mockStatuses[i] }));

const StatusDot = ({ status }: { status: Table['status'] }) => (
  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: STATUS_DOT[status] }} />
);

export default function Home() {
  const orders = useOrderStore((s) => s.orders);
  const getStatus = (id: number): Table['status'] => {
    const o = orders[String(id)];
    const hasItems = o && Object.keys(o.lines).length > 0;
    return hasItems ? 'occupied' : 'empty';
  };
  return (
    <View style={styles.container}>
      <NavBar title="Home" />
      <Text style={styles.heading}>Tables</Text>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}><View style={[styles.legendDot,{backgroundColor:STATUS_DOT.empty}]} /><Text>Empty</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot,{backgroundColor:STATUS_DOT.ordering}]} /><Text>Ordering</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot,{backgroundColor:STATUS_DOT.occupied}]} /><Text>Occupied</Text></View>
      </View>
      <FlatList
        data={tables}
        numColumns={3}
        keyExtractor={(t) => String(t.id)}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 16 }}
        renderItem={({ item }) => {
          const status = getStatus(item.id);
          return (
            <Pressable style={[styles.tile, { backgroundColor: STATUS_COLOR[status], borderColor: STATUS_DOT[status] }]} onPress={() => router.push({ pathname: '/table', params: { id: item.id } })}>
              <Text style={styles.tileTitle}>{item.name}</Text>
              <StatusDot status={status} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: 20, fontWeight: '600', padding: 16 },
  tile: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileTitle: { fontSize: 18, fontWeight: '600' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
});


