import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export default function Login() {
  const [pin, setPin] = useState('');

  const onLogin = async () => {
    const savedPin = (await SecureStore.getItemAsync('waiter_pin')) || '0000';
    if (pin === savedPin) {
      router.replace('/home');
    } else {
      Alert.alert('Invalid PIN');
    }
  };

  const onBiometric = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return onLogin();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return onLogin();
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate' });
    if (res.success) router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiter Login</Text>
      <TextInput value={pin} onChangeText={setPin} placeholder="Enter PIN" keyboardType="number-pad" secureTextEntry style={styles.input} />
      <Button title="Login" onPress={onLogin} />
      <View style={{ height: 12 }} />
      <Button title="Use Fingerprint/Face" onPress={onBiometric} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
});


