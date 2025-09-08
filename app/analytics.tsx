import { View, Text, StyleSheet } from 'react-native';

export default function Analytics() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text>Daily Sales: ₹12,340</Text>
      <Text>Weekly Sales: ₹84,120</Text>
      <Text>Monthly Sales: ₹3,12,500</Text>
      <View style={{ height: 16 }} />
      <Text>Top Dishes: Paneer, Dal, Chapati</Text>
      <Text>Avg Order→Bill Time: 18m</Text>
      <Text>Top Waiter: Aman (24 orders)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
});


