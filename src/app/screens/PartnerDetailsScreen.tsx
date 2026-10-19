import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function PartnerDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const partnerKey = params.key as string;
  const partnerName = params.name as string;
  const profitShare = Number(params.profit) || 0;

  const [transactions, setTransactions] = useState<any[]>([]);
  
  // ઉમેરવાનું મોડલ
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('withdraw'); // withdraw કે expense
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [slipImage, setSlipImage] = useState<string | null>(null);

  // ડિલીટ/વિગતો જોવાનું મોડલ
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useFocusEffect(useCallback(() => { loadTransactions(); }, []));

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem('@jca_transactions');
      if (stored) setTransactions(JSON.parse(stored));
    } catch (e) { console.log(e); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.5 });
    if (!result.canceled) setSlipImage(result.assets[0].uri);
  };

  const handleSaveTransaction = async () => {
    if (!amount || !date) return Alert.alert('ધ્યાન આપો', 'તારીખ અને રકમ ભરો.');
    if (!slipImage && !note) return Alert.alert('ધ્યાન આપો', 'સ્ક્રીનશોટ અપલોડ કરો અથવા નોંધમાં CASH લખો.');

    const newTransaction = {
      id: Date.now().toString(),
      type: modalType,
      partnerKey: partnerKey,
      amount: Number(amount),
      date: date,
      note: slipImage ? 'Screenshot Attached' : note,
      image: slipImage
    };

    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    await AsyncStorage.setItem('@jca_transactions', JSON.stringify(updated));
    
    setShowModal(false); setAmount(''); setNote(''); setDate(''); setSlipImage(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    Alert.alert('ચેતવણી', 'શું તમે ખરેખર આ વિગત ડિલીટ કરવા માંગો છો?', [
      { text: 'ના', style: 'cancel' },
      { text: 'હા', style: 'destructive', onPress: async () => {
        const updated = transactions.filter(t => t.id !== id);
        setTransactions(updated);
        await AsyncStorage.setItem('@jca_transactions', JSON.stringify(updated));
        setSelectedTransaction(null);
      }}
    ]);
  };

  // આ પાર્ટનરના ટ્રાન્ઝેક્શન અલગ કરો
  const myTransactions = transactions.filter(t => t.partnerKey === partnerKey);
  const myWithdrawals = myTransactions.filter(t => t.type === 'withdraw');
  const myExpenses = myTransactions.filter(t => t.type === 'expense');

  const totalWithdraw = myWithdrawals.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = myExpenses.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = profitShare - totalWithdraw + totalExpense;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{partnerName}</Text>
        <View style={{width: 50}} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        
        {/* મુખ્ય હિસાબ */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>કુલ મુનાફો (હિસ્સો)</Text>
            <Text style={[styles.summaryVal, {color: '#0a9d5c'}]}>₹{profitShare.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>કુલ ઉપાડ (Drawings)</Text>
            <Text style={[styles.summaryVal, {color: '#d63a3a'}]}>₹{totalWithdraw.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>ખિસ્સામાંથી ખર્ચ</Text>
            <Text style={[styles.summaryVal, {color: '#0a9d5c'}]}>₹{totalExpense.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={{fontWeight: 'bold', fontSize: 16, color: '#0B2545'}}>ચોખ્ખી લેવાદેવા:</Text>
            <Text style={{fontWeight: 'bold', fontSize: 20, color: netBalance >= 0 ? '#0a9d5c' : '#d63a3a'}}>
              ₹{Math.abs(netBalance).toLocaleString('en-IN')} {netBalance >= 0 ? '(લેવાના)' : '(આપવાના)'}
            </Text>
          </View>
        </View>

        {/* એક્શન બટન્સ */}
        <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#d63a3a'}]} onPress={() => { setModalType('withdraw'); setShowModal(true); }}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>+ ઉપાડ લીધો</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#0a9d5c'}]} onPress={() => { setModalType('expense'); setShowModal(true); }}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>+ ખિસ્સામાંથી ખર્ચ</Text>
          </TouchableOpacity>
        </View>

        {/* ઉપાડની લિસ્ટ */}
        <Text style={styles.sectionTitle}>ઉપાડની યાદી</Text>
        {myWithdrawals.length === 0 && <Text style={styles.emptyText}>કોઈ ઉપાડ નથી.</Text>}
        {myWithdrawals.map(t => (
          <TouchableOpacity key={t.id} style={styles.listItem} onPress={() => setSelectedTransaction(t)}>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: 'bold', color: '#d63a3a'}}>₹{t.amount}</Text>
              <Text style={{fontSize: 10, color: '#888'}}>{t.date} | {t.note}</Text>
            </View>
            {t.image ? <Image source={{uri: t.image}} style={styles.thumb} /> : <Text style={{fontSize: 10, color: 'green', fontWeight:'bold'}}>CASH</Text>}
          </TouchableOpacity>
        ))}

        {/* ખર્ચની લિસ્ટ */}
        <Text style={styles.sectionTitle}>ખિસ્સામાંથી થયેલો ખર્ચ</Text>
        {myExpenses.length === 0 && <Text style={styles.emptyText}>કોઈ ખર્ચ નથી.</Text>}
        {myExpenses.map(t => (
          <TouchableOpacity key={t.id} style={styles.listItem} onPress={() => setSelectedTransaction(t)}>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: 'bold', color: '#0a9d5c'}}>₹{t.amount}</Text>
              <Text style={{fontSize: 10, color: '#888'}}>{t.date} | {t.note}</Text>
            </View>
            {t.image ? <Image source={{uri: t.image}} style={styles.thumb} /> : <Text style={{fontSize: 10, color: 'green', fontWeight:'bold'}}>CASH</Text>}
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* 1. ઉમેરવાનું મોડલ */}
      <Modal visible={showModal} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{modalType === 'withdraw' ? 'ઉપાડ ઉમેરો' : 'ખર્ચ ઉમેરો'}</Text>
            
            <TextInput style={styles.inputBox} placeholder="તારીખ (દા.ત. 19-10-2026)" value={date} onChangeText={setDate} />
            <TextInput style={styles.inputBox} placeholder="રકમ (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            
            <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
              {slipImage ? <Image source={{uri: slipImage}} style={{width:'100%', height:'100%'}} /> : <Text style={{color: '#F58220', fontWeight: 'bold'}}>+ સ્ક્રીનશોટ ઉમેરો</Text>}
            </TouchableOpacity>

            <TextInput style={styles.inputBox} placeholder="અથવા નોંધ લખો (દા.ત. CASH)" value={note} onChangeText={setNote} />

            <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e2e8f0' }]} onPress={() => setShowModal(false)}><Text style={{ fontWeight: 'bold', color: '#4a5568' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#0a9d5c' }]} onPress={handleSaveTransaction}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. વિગતો જોવા અને ડિલીટ કરવાનું મોડલ */}
      <Modal visible={!!selectedTransaction} transparent={true} animationType="fade">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <View style={{backgroundColor: '#fff', width: '100%', borderRadius: 15, padding: 20}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
              <Text style={{fontSize: 20, fontWeight: 'bold', color: selectedTransaction?.type === 'withdraw' ? '#d63a3a' : '#0a9d5c'}}>
                {selectedTransaction?.type === 'withdraw' ? 'ઉપાડની વિગત' : 'ખર્ચની વિગત'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedTransaction(null)}><Text style={{fontSize: 20, fontWeight: 'bold', color: '#888'}}>✕</Text></TouchableOpacity>
            </View>

            <Text style={{fontSize: 16, marginBottom: 5}}><Text style={{fontWeight: 'bold'}}>રકમ: </Text>₹{selectedTransaction?.amount}</Text>
            <Text style={{fontSize: 16, marginBottom: 5}}><Text style={{fontWeight: 'bold'}}>તારીખ: </Text>{selectedTransaction?.date}</Text>
            <Text style={{fontSize: 16, marginBottom: 15}}><Text style={{fontWeight: 'bold'}}>નોંધ: </Text>{selectedTransaction?.note}</Text>

            {selectedTransaction?.image && (
              <Image source={{uri: selectedTransaction.image}} style={{width: '100%', height: 200, borderRadius: 10, marginBottom: 15, resizeMode: 'contain', backgroundColor: '#f1f5f9'}} />
            )}

            <TouchableOpacity style={{backgroundColor: '#d63a3a', padding: 15, borderRadius: 10, alignItems: 'center'}} onPress={() => handleDeleteTransaction(selectedTransaction.id)}>
              <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>🗑 આ વિગત ડિલીટ કરો</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fb' },
  header: { backgroundColor: '#0B2545', padding: 20, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  backBtn: { padding: 5 },
  
  summaryCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLbl: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  summaryVal: { fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  
  actionBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginTop: 10, marginBottom: 10 },
  emptyText: { color: '#888', fontStyle: 'italic', marginBottom: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, elevation: 1 },
  thumb: { width: 35, height: 35, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' },
  
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#0B2545' },
  inputBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  imgPicker: { height: 80, backgroundColor: '#f1f5f9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', overflow: 'hidden' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' }
});
