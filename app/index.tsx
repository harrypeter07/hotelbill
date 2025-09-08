import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BillBuddy - Hotel Waiter</Text>
      <Link href="/login">Go to Login</Link>
      <Link style={{ marginTop: 12 }} href="/(tabs)/home">Open App</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
});


