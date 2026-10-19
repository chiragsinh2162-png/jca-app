import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // લોગિન બટન દબાવવાનું લોજિક
  const handleLogin = () => {
    if (username === 'chirag' && password === '12345') {
      setIsLoggedIn(true);
    } else {
      Alert.alert('ભૂલ!', 'યુઝરનેમ અથવા પાસવર્ડ ખોટો છે.');
    }
  };

  // જો લોગિન થઈ ગયું હોય તો ડેશબોર્ડ બતાવો
  if (isLoggedIn) {
    return (
      <View style={styles.dashboard}>
        <Text style={styles.dashTitle}>Jai Chehar Auto Consult</Text>
        <Text style={styles.dashSub}>તમારું ડેશબોર્ડ તૈયાર છે!</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setIsLoggedIn(false)}>
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // નહીં તો લોગિન સ્ક્રીન બતાવો
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>JCA</Text>
      <Text style={styles.title}>Jai Chehar Auto Consult</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B2545' },
  logo: { fontSize: 50, fontWeight: 'bold', color: '#F58220', marginBottom: 10 },
  title: { fontSize: 20, color: '#fff', marginBottom: 40, fontWeight: 'bold' },
  input: { width: '80%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  loginBtn: { width: '80%', backgroundColor: '#F58220', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dashboard: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6fb' },
  dashTitle: { fontSize: 24, fontWeight: 'bold', color: '#0B2545', marginBottom: 10 },
  dashSub: { fontSize: 16, color: '#6b7a94', marginBottom: 30 },
  logoutBtn: { backgroundColor: '#d63a3a', padding: 12, borderRadius: 10, width: 150, alignItems: 'center' }
});
