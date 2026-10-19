import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [billImage, setBillImage] = useState<string | null>(null);

  const [viewImage, setViewImage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem('@jca_office_expenses');
      if (stored) setExpenses(JSON.parse(stored));
      else setExpenses([]);
    } catch (e) { console.log(e); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) setBillImage(result.assets[0].uri);
  };

  const handleSaveExpense = async () => {
    if (!title || !amount || !date) {
      return Alert.alert('ધ્યાન આપો', 'ખર્ચની વિગત, રકમ અને તારીખ ભરો.');
    }
    
    const newExpense = {
      id: Date.now().toString(),
      title,
      amount: Number(amount),
      date,
      image: billImage,
    };
    
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('@jca_office_expenses', JSON.stringify(updated));
    
    setShowModal(false);
    setTitle(''); setAmount(''); setDate(''); setBillImage(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert('ચેતવણી', 'શું તમે આ ખર્ચ ડિલીટ કરવા માંગો છો?', [
      { text: 'ના' },
      { text: 'હા', onPress: async () => {
        const updated = expenses.filter(e => e.id !== id);
        setExpenses(updated);
        await AsyncStorage.setItem('@jca_office_expenses', JSON.stringify(updated));
      }}
    ]);
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ઓફિસ ખર્ચ (Expenses)</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Text style={{color: '#F58220', fontSize: 16, fontWeight: 'bold'}}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>કુલ ઓફિસ ખર્ચ</Text>
          <Text style={styles.totalValue}>₹{totalExpense.toLocaleString('en-IN')}</Text>
        </View>

        {expenses.length === 0 && <Text style={{textAlign: 'center', color: '#888', marginTop: 20}}>કોઈ ખર્ચ નોંધાયેલો નથી.</Text>}

        {expenses.map((exp) => (
          <View key={exp.id} style={styles.expCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View style={{flex: 1}}>
                <Text style={styles.expTitle}>{exp.title}</Text>
                <Text style={{color: '#888', fontSize: 12, marginTop: 2}}>તારીખ: {exp.date}</Text>
              </View>
              <Text style={styles.expAmount}>₹{exp.amount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10}}>
              {exp.image ? (
                <TouchableOpacity onPress={() => setViewImage(exp.image)}>
                  <Image source={{ uri: exp.image }} style={styles.billImageSmall} />
                </TouchableOpacity>
              ) : (
                <Text style={{fontSize: 12, color: 'green', fontWeight: 'bold'}}>CASH (કોઈ બિલ નથી)</Text>
              )}

              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(exp.id)}>
                <Text style={{color: '#d63a3a', fontWeight: 'bold', fontSize: 12}}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ખર્ચ ઉમેરવાનું મોડલ */}
      <Modal visible={showModal} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>નવો ખર્ચ ઉમેરો</Text>
            
            <TextInput style={styles.inputBox} placeholder="ખર્ચની વિગત (દા.ત. ચા-નાસ્તો)" value={title} onChangeText={setTitle} />
            <TextInput style={styles.inputBox} placeholder="રકમ (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <TextInput style={styles.inputBox} placeholder="તારીખ (દા.ત. 19-10-2026)" value={date} onChangeText={setDate} />
            
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {billImage ? <Image source={{ uri: billImage }} style={{width:'100%', height:'100%'}} /> : <Text style={{color: '#F58220', fontWeight: 'bold'}}>+ બિલનો ફોટો ઉમેરો (ઓપ્શનલ)</Text>}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e2e8f0' }]} onPress={() => setShowModal(false)}><Text style={{ fontWeight: 'bold', color: '#4a5568' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#0a9d5c' }]} onPress={handleSaveExpense}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ઈમેજ મોટી કરીને જોવાનું મોડલ */}
      <Modal visible={!!viewImage} transparent={true} animationType="fade">
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center'}}>
          <TouchableOpacity style={{position: 'absolute', top: 40, right: 20, zIndex: 10}} onPress={() => setViewImage(null)}>
            <Text style={{color: '#fff', fontSize: 30, fontWeight: 'bold'}}>✕</Text>
          </TouchableOpacity>
          {viewImage && <Image source={{uri: viewImage}} style={{width: '90%', height: '70%', resizeMode: 'contain'}} />}
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
  totalCard: { backgroundColor: '#0B2545', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  totalLabel: { color: '#fff', fontSize: 14, opacity: 0.8 },
  totalValue: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 5 },
  expCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  expTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B2545' },
  expAmount: { fontSize: 18, fontWeight: 'bold', color: '#d63a3a' },
  billImageSmall: { width: 50, height: 50, borderRadius: 8, resizeMode: 'cover' },
  deleteBtn: { padding: 5 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#0B2545' },
  inputBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  imagePicker: { height: 100, backgroundColor: '#f1f5f9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', overflow: 'hidden' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' }
});
