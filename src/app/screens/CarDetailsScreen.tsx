import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';

export default function CarDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [car, setCar] = useState<any>(null);

  useFocusEffect(useCallback(() => { loadCar(); }, []));

  const loadCar = async () => {
    try {
      const stored = await AsyncStorage.getItem('@jca_cars');
      if (stored) {
        const cars = JSON.parse(stored);
        setCar(cars.find((c: any) => c.id === id));
      }
    } catch (e) { console.log(e); }
  };

  const openImage = (uri: string) => Alert.alert('ડોક્યુમેન્ટ', 'આ ફોટો છે: ' + uri);

  if (!car) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>ગાડીની વિગતો</Text>
        <View style={{width: 50}} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {car.image && <Image source={{ uri: car.image }} style={styles.mainImage} />}
        <Text style={styles.carName}>{car.make} {car.model}</Text>
        <Text style={styles.carStatus}>સ્થિતિ: {car.status === 'sold' ? 'વેચાયેલી (SOLD)' : 'સ્ટોકમાં (IN STOCK)'}</Text>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>ડોક્યુમેન્ટ્સ</Text>
        <View style={styles.docRow}>
          <TouchableOpacity style={styles.docBox} onPress={() => car.docs?.rc && openImage(car.docs.rc)}>
            {car.docs?.rc ? <Image source={{ uri: car.docs.rc }} style={styles.docImage} /> : <Text style={styles.docText}>RC નથી</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.docBox} onPress={() => car.docs?.puc && openImage(car.docs.puc)}>
            {car.docs?.puc ? <Image source={{ uri: car.docs.puc }} style={styles.docImage} /> : <Text style={styles.docText}>PUC નથી</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.docBox} onPress={() => car.docs?.insurance && openImage(car.docs.insurance)}>
            {car.docs?.insurance ? <Image source={{ uri: car.docs.insurance }} style={styles.docImage} /> : <Text style={styles.docText}>Insurance નથી</Text>}
          </TouchableOpacity>
        </View>

        {car.status === 'sold' && car.buyer && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>ગ્રાહકની વિગતો</Text>
            <Text style={styles.detailText}>નામ: {car.buyer.name}</Text>
            <Text style={styles.detailText}>મોબાઈલ: {car.buyer.phone}</Text>
            <Text style={styles.detailText}>આધાર: {car.buyer.aadhar}</Text>
            <Text style={styles.detailText}>વેચાણ કિંમત: ₹{car.sellingPrice.toLocaleString('en-IN')}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fb' },
  header: { backgroundColor: '#0B2545', padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  backBtn: { padding: 5 },
  mainImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 15 },
  carName: { fontSize: 24, fontWeight: 'bold', color: '#0B2545' },
  carStatus: { fontSize: 14, color: '#666', marginTop: 5, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginBottom: 10 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between' },
  docBox: { flex: 1, height: 80, backgroundColor: '#fff', borderRadius: 8, marginHorizontal: 3, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  docImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  docText: { fontSize: 10, color: '#888' },
  detailText: { fontSize: 16, color: '#4a5568', marginBottom: 5, fontWeight: '500' }
});
