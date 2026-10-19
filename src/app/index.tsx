import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

export default function App() {
  const router = useRouter();
  
  // લોગિન સિસ્ટમ
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [cars, setCars] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  // સેલ મોડલ સ્ટેટ્સ
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [sellingPrice, setSellingPrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAadhar, setBuyerAadhar] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadCars();
    }, [])
  );

  const loadCars = async () => {
    try {
      const storedCars = await AsyncStorage.getItem('@jca_cars');
      if (storedCars) setCars(JSON.parse(storedCars));
      else setCars([]);
    } catch (e) { console.log(e); }
  };

  const saveCars = async (updatedCars: any[]) => {
    setCars(updatedCars);
    await AsyncStorage.setItem('@jca_cars', JSON.stringify(updatedCars));
  };

  const handleLogin = () => {
    if (username === 'chirag' && password === '12345') setIsLoggedIn(true);
    else Alert.alert('ભૂલ!', 'યુઝરનેમ અથવા પાસવર્ડ ખોટો છે.');
  };

  const handleSell = () => {
    if (!sellingPrice || !buyerName || !buyerPhone) {
      Alert.alert('ધ્યાન આપો', 'ગ્રાહકનું નામ, મોબાઈલ અને કિંમત ભરો.');
      return;
    }
    const updated = cars.map(car => {
      if (car.id === selectedCarId) {
        return { 
          ...car, 
          status: 'sold', 
          sellingPrice: Number(sellingPrice),
          buyer: { name: buyerName, phone: buyerPhone, aadhar: buyerAadhar }
        };
      }
      return car;
    });
    saveCars(updated);
    setShowSellModal(false);
    setSellingPrice(''); setBuyerName(''); setBuyerPhone(''); setBuyerAadhar('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('ચેતવણી', 'શું તમે ખરેખર આ ગાડી ડિલીટ કરવા માંગો છો?', [
      { text: 'ના' }, { text: 'હા', onPress: () => saveCars(cars.filter(c => c.id !== id)) }
    ]);
  };

  const totalCars = cars.length;
  const inStock = cars.filter(c => c.status === 'stock').length;
  const invested = cars.filter(c => c.status === 'stock').reduce((sum, c) => sum + (c.purchasePrice || 0), 0);
  const totalProfit = cars.filter(c => c.status === 'sold').reduce((sum, c) => sum + (c.sellingPrice - (c.purchasePrice || 0)), 0);

  const filteredCars = cars.filter(car => {
    if (filter === 'stock') return car.status === 'stock';
    if (filter === 'sold') return car.status === 'sold';
    return true;
  });

  // ડેશબોર્ડ સ્ક્રીન
  if (isLoggedIn) {
    return (
      <SafeAreaView style={styles.dashboard}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            
            <View style={styles.headerArea}>
              <Image source={require('../../assets/logo.png')} style={styles.headerLogo} />
              <Text style={styles.brandTitle}>JAY CHEHAR</Text>
              <Text style={styles.brandSub}>AUTO CONSULT</Text>
            </View>

            <View style={styles.mainContainer}>
              <View style={styles.dashTitleRow}>
                <Text style={styles.dashMainTitle}>Dashboard</Text>
                <TouchableOpacity style={styles.logoutBtn} onPress={() => setIsLoggedIn(false)}>
                  <Text style={styles.btnTextSmall}>Logout</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: '#0B2545' }]}><Text style={styles.statLabel}>TOTAL CARS</Text><Text style={styles.statValue}>{totalCars}</Text></View>
                <View style={[styles.statCard, { borderLeftColor: '#F58220' }]}><Text style={styles.statLabel}>IN STOCK</Text><Text style={[styles.statValue, {color: '#F58220'}]}>{inStock}</Text></View>
                <View style={[styles.statCard, { borderLeftColor: '#d63a3a' }]}><Text style={styles.statLabel}>INVESTED (₹)</Text><Text style={[styles.statValue, {color: '#d63a3a'}]}>{invested.toLocaleString('en-IN')}</Text></View>
                <View style={[styles.statCard, { borderLeftColor: '#0a9d5c' }]}><Text style={styles.statLabel}>TOTAL PROFIT (₹)</Text><Text style={[styles.statValue, {color: '#0a9d5c'}]}>{totalProfit.toLocaleString('en-IN')}</Text></View>
              </View>

              {/* એક્શન બટન્સ */}
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d63a3a', width: '100%', marginBottom: 15, marginHorizontal: 0 }]} onPress={() => router.push('/screens/ExpensesScreen')}>
                <Text style={styles.btnText}>ઓફિસ ખર્ચ (Expenses)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.partnerButton} onPress={() => router.push('/screens/PartnersScreen')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerButtonTitle}>ભાગીદારોનો હિસ્સો (Partners)</Text>
                  <Text style={{color: '#fff', opacity: 0.7, fontSize: 12, marginTop: 2}}>રોકાણ મુજબ નફાની વહેંચણી જોવા ક્લિક કરો</Text>
                </View>
                <Text style={{color: '#fff', fontSize: 22, fontWeight: 'bold'}}>➔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addBtnMain} onPress={() => router.push('/screens/AddCarScreen')}>
                <Text style={styles.btnText}>+ નવી ગાડી ઉમેરો</Text>
              </TouchableOpacity>

              <View style={styles.filterRow}>
                <TouchableOpacity style={[styles.filterBtn, filter === 'all' && styles.filterActive]} onPress={() => setFilter('all')}><Text style={[styles.filterText, filter === 'all' && {color:'#fff'}]}>All</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, filter === 'stock' && styles.filterActive]} onPress={() => setFilter('stock')}><Text style={[styles.filterText, filter === 'stock' && {color:'#fff'}]}>Stock</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, filter === 'sold' && styles.filterActive]} onPress={() => setFilter('sold')}><Text style={[styles.filterText, filter === 'sold' && {color:'#fff'}]}>Sold</Text></TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>તમારી ગાડીઓ ({filteredCars.length})</Text>
              
              {filteredCars.map((car) => (
                <View key={car.id} style={[styles.carCard, car.status === 'sold' && styles.carSold]}>
                  {car.image ? <Image source={{ uri: car.image }} style={styles.cardImage} /> : <View style={[styles.cardImage, { backgroundColor: '#e1e9f5', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 40 }}>🚗</Text></View>}
                  <View style={styles.cardBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.carName}>{car.make} {car.model}</Text>
                      <View style={[styles.badge, car.status === 'sold' ? styles.badgeSold : styles.badgeStock]}><Text style={[styles.badgeText, { color: car.status === 'sold' ? '#d63a3a' : '#0a9d5c' }]}>{car.status === 'sold' ? 'SOLD' : 'IN STOCK'}</Text></View>
                    </View>
                    <View style={styles.priceRow}>
                       <Text style={styles.carPrice}>ખરીદ: ₹{(car.purchasePrice || 0).toLocaleString('en-IN')}</Text>
                       {car.status === 'sold' && <Text style={styles.carSoldText}>વેચાણ: ₹{(car.sellingPrice || 0).toLocaleString('en-IN')}</Text>}
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/screens/CarDetailsScreen?id=${car.id}`)}><Text style={styles.btnTextSmall}>View</Text></TouchableOpacity>
                      {car.status === 'stock' && <TouchableOpacity style={styles.sellBtn} onPress={() => { setSelectedCarId(car.id); setShowSellModal(true); }}><Text style={styles.btnTextSmall}>Sell</Text></TouchableOpacity>}
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(car.id)}><Text style={styles.btnTextSmall}>Delete</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* સેલ મોડલ */}
        <Modal visible={showSellModal} transparent={true} animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>ગ્રાહકની વિગતો ભરો</Text>
              <TextInput style={styles.inputBox} placeholder="ગ્રાહકનું નામ *" value={buyerName} onChangeText={setBuyerName} />
              <TextInput style={styles.inputBox} placeholder="મોબાઈલ નંબર *" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="numeric" />
              <TextInput style={styles.inputBox} placeholder="આધાર કાર્ડ નંબર" value={buyerAadhar} onChangeText={setBuyerAadhar} keyboardType="numeric" />
              <TextInput style={styles.inputBox} placeholder="વેચાણ કિંમત (₹) *" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" />
              <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e2e8f0' }]} onPress={() => setShowSellModal(false)}><Text style={{ fontWeight: 'bold', color: '#4a5568' }}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#0a9d5c' }]} onPress={handleSell}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // લોગિન સ્ક્રીન
  return (
    <SafeAreaView style={styles.loginContainer}>
      <Image source={require('../../assets/logo.png')} style={{ width: 140, height: 140, resizeMode: 'contain', marginBottom: 20 }} />
      <Text style={styles.title}>Jai Chehar Auto Consult</Text>
      <TextInput style={styles.inputBoxLogin} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.inputBoxLogin} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}><Text style={styles.btnText}>Login</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B2545' },
  title: { fontSize: 22, color: '#fff', marginBottom: 30, fontWeight: 'bold' },
  inputBoxLogin: { width: '85%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  loginBtn: { width: '85%', backgroundColor: '#F58220', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  dashboard: { flex: 1, backgroundColor: '#f4f6fb' },
  headerArea: { backgroundColor: '#0B2545', alignItems: 'center', paddingTop: 50, paddingBottom: 25, borderBottomWidth: 4, borderBottomColor: '#F58220' },
  headerLogo: { width: 70, height: 70, resizeMode: 'contain', marginBottom: 5, backgroundColor: '#fff', borderRadius: 10 },
  brandTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  brandSub: { fontSize: 12, color: '#F58220', fontWeight: 'bold', letterSpacing: 3 },
  mainContainer: { padding: 15 },
  dashTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dashMainTitle: { fontSize: 24, fontWeight: 'bold', color: '#0B2545' },
  logoutBtn: { backgroundColor: '#d63a3a', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, borderLeftWidth: 5 },
  statLabel: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  statValue: { fontSize: 20, color: '#0B2545', fontWeight: '900', marginTop: 5 },
  actionBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5, elevation: 2 },
  partnerButton: { backgroundColor: '#0B2545', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3 },
  partnerButtonTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addBtnMain: { backgroundColor: '#F58220', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15, elevation: 3 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  filterBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 3, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  filterActive: { backgroundColor: '#0B2545', borderColor: '#0B2545' },
  filterText: { fontWeight: 'bold', color: '#4a5568' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0B2545', marginBottom: 10 },
  carCard: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, elevation: 4, overflow: 'hidden' },
  carSold: { opacity: 0.9, borderColor: '#0a9d5c', borderWidth: 1 },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  cardBody: { padding: 15 },
  carName: { fontSize: 18, fontWeight: 'bold', color: '#0B2545', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeStock: { backgroundColor: '#e6f7ef' },
  badgeSold: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 10, fontWeight: '900' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  carPrice: { fontSize: 14, color: '#4a5568', fontWeight: 'bold' },
  carSoldText: { fontSize: 14, color: '#d63a3a', fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', marginTop: 15, gap: 8 },
  viewBtn: { flex: 1, backgroundColor: '#F58220', padding: 12, borderRadius: 8, alignItems: 'center' },
  sellBtn: { flex: 1, backgroundColor: '#0B2545', padding: 12, borderRadius: 8, alignItems: 'center' },
  deleteBtn: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, alignItems: 'center', width: 70 },
  btnTextSmall: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  modalView: { backgroundColor: '#fff', padding: 25, borderRadius: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#0B2545' },
  inputBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' }
});
