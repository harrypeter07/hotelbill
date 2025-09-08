import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function DuePayment() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const capturePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.title}>Due Payment</Text>
      <TextInput placeholder="Customer Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
      {photoUri ? <Image source={{ uri: photoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} /> : null}
      <View style={{ height: 12 }} />
      <Pressable style={styles.secondary} onPress={capturePhoto}><Text style={styles.secondaryText}>Capture Photo</Text></Pressable>
      <View style={{ height: 12 }} />
      <Pressable style={styles.primary} onPress={() => router.replace('/home')}><Text style={styles.primaryText}>Save as Due</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  primary: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '600' },
  secondary: { backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  secondaryText: { color: '#111827', fontWeight: '600' },
});


