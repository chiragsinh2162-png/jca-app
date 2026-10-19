import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

export default function PartnersScreen() {
  const router = useRouter();
  const [cars, setCars] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const partners = {
    p1: 'Chauhan Savjibhai',
    p2: 'Vaghela Dilipsinh',
    p3: 'Purohit Vasantbhai',
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const storedCars = await AsyncStorage.getItem('@jca_cars');
      if (storedCars) setCars(JSON.parse(storedCars));
      
      const storedTransactions = await AsyncStorage.getItem('@jca_transactions');
      if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    } catch (e) { console.log(e); }
  };

  // પ્રોફિટ કેલ્ક્યુલેશન (રોકાણ મુજબ)
  let p1Profit = 0; let p2Profit = 0; let p3Profit = 0;
  cars.filter(c => c.status === 'sold').forEach(car => {
    const carProfit = car.sellingPrice - (car.purchasePrice || 0) - (car.repairCost || 0);
    const inv = car.partnersInvestment || { p1: 0, p2: 0, p3: 0 };
    const totalInv = inv.p1 + inv.p2 + inv.p3;

    if (totalInv === 0) {
      p1Profit += carProfit / 3; p2Profit += carProfit / 3; p3Profit += carProfit / 3;
    } else {
      if (inv.p1 > 0) p1Profit += (inv.p1 / totalInv) * carProfit;
      if (inv.p2 > 0) p2Profit += (inv.p2 / totalInv) * carProfit;
      if (inv.p3 > 0) p3Profit += (inv.p3 / totalInv) * carProfit;
    }
  });

  const renderPartnerRow = (key: string, name: string, profit: number) => {
    const pWithdraw = transactions.filter(t => t.partnerKey === key && t.type === 'withdraw').reduce((s, t) => s + t.amount, 0);
    const pExpense = transactions.filter(t => t.partnerKey === key && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push(`/screens/PartnerDetailsScreen?key=${key}&name=${name}&profit=${profit}&withdraw=${pWithdraw}&expense=${pExpense}`)}
      >
        <View style={{flex: 1}}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subText}>કુલ મુનાફો: ₹{profit.toLocaleString('en-IN')}</Text>
        </View>
        <Text style={{color: '#F58220', fontSize: 20, fontWeight: 'bold'}}>➔</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>ભાગીદારો</Text>
        <View style={{width: 50}} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{textAlign: 'center', color: '#666', marginBottom: 20}}>વિગતો જોવા માટે નામ પર ક્લિક કરો</Text>
        {renderPartnerRow('p1', partners.p1, p1Profit)}
        {renderPartnerRow('p2', partners.p2, p2Profit)}
        {renderPartnerRow('p3', partners.p3, p3Profit)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fb' },
  header: { backgroundColor: '#0B2545', padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  backBtn: { padding: 5 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0B2545' },
  subText: { fontSize: 14, color: '#0a9d5c', fontWeight: 'bold', marginTop: 5 }
});
