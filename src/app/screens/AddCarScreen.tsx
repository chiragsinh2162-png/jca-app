import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function AddCarScreen() {
  const router = useRouter();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');
  const [fuel, setFuel] = useState('');
  const [transmission, setTransmission] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  
  const [carImage, setCarImage] = useState<string | null>(null);
  const [rcImage, setRcImage] = useState<string | null>(null);
  const [pucImage, setPucImage] = useState<string | null>(null);
  const [insImage, setInsImage] = useState<string | null>(null);
  
  const [p1Inv, setP1Inv] = useState('');
  const [p2Inv, setP2Inv] = useState('');
  const [p3Inv, setP3Inv] = useState('');

  const pickImage = async (setter: any) => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.5 });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const handleSaveCar = async () => {
    if (!make || !model || !purchasePrice) return Alert.alert('ધ્યાન આપો', 'બ્રાન્ડ, મોડલ અને કિંમત ભરો.');

    try {
      const storedCars = await AsyncStorage.getItem('@jca_cars');
      const cars = storedCars ? JSON.parse(storedCars) : [];

      const newCar = {
        id: Date.now().toString(),
        make, model, year, km, fuel, transmission,
        purchasePrice: Number(purchasePrice), repairCost: 0,
        image: carImage,
        docs: { rc: rcImage, puc: pucImage, insurance: insImage },
        status: 'stock', sellingPrice: 0, buyer: null,
        partnersInvestment: { p1: Number(p1Inv) || 0, p2: Number(p2Inv) || 0, p3: Number(p3Inv) || 0 }
      };

      await AsyncStorage.setItem('@jca_cars', JSON.stringify([...cars, newCar]));
      Alert.alert('સફળ!', 'ગાડી ઉમેરાઈ ગઈ.');
      router.back(); 
    } catch (e) { Alert.alert('એરર', 'ડેટા સેવ ન થયો.'); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}><Text style={styles.headerTitle}>નવી ગાડી ઉમેરો</Text></View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          
          <Text style={styles.sectionHeader}>ગાડીનો ફોટો</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(setCarImage)}>
            {carImage ? <Image source={{ uri: carImage }} style={styles.pickedImage} /> : <Text style={styles.addText}>+ ફોટો ઉમેરો</Text>}
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>મુખ્ય વિગતો</Text>
          <TextInput style={styles.input} placeholder="બ્રાન્ડ (Make)" value={make} onChangeText={setMake} />
          <TextInput style={styles.input} placeholder="મોડલ (Model)" value={model} onChangeText={setModel} />
          
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="વર્ષ (Year)" value={year} onChangeText={setYear} keyboardType="numeric" />
            <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="કિમી (KM)" value={km} onChangeText={setKm} keyboardType="numeric" />
          </View>
          
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="ફ્યુલ (Petrol)" value={fuel} onChangeText={setFuel} />
            <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="ટ્રાન્સમિશન (Manual)" value={transmission} onChangeText={setTransmission} />
          </View>

          <TextInput style={styles.input} placeholder="ખરીદ કિંમત (₹)" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" />

          <Text style={styles.sectionHeader}>ડોક્યુમેન્ટ્સ (ફોટા)</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.docBox} onPress={() => pickImage(setRcImage)}>
              {rcImage ? <Image source={{ uri: rcImage }} style={styles.pickedImage} /> : <Text style={styles.addText}>+ RC બુક</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.docBox} onPress={() => pickImage(setPucImage)}>
              {pucImage ? <Image source={{ uri: pucImage }} style={styles.pickedImage} /> : <Text style={styles.addText}>+ PUC</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.docBox} onPress={() => pickImage(setInsImage)}>
              {insImage ? <Image source={{ uri: insImage }} style={styles.pickedImage} /> : <Text style={styles.addText}>+ Insurance</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>પાર્ટનરનું રોકાણ (₹)</Text>
          <TextInput style={styles.input} placeholder="Chauhan Savjibhai" value={p1Inv} onChangeText={setP1Inv} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Vaghela Dilipsinh" value={p2Inv} onChangeText={setP2Inv} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Purohit Vasantbhai" value={p3Inv} onChangeText={setP3Inv} keyboardType="numeric" />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCar}><Text style={styles.saveBtnText}>ગાડી સેવ કરો</Text></TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fb' },
  header: { backgroundColor: '#0B2545', padding: 20, paddingTop: 40, alignItems: 'center' },
  headerTitle: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginTop: 15, marginBottom: 10 },
  imagePicker: { height: 150, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', overflow: 'hidden' },
  docBox: { flex: 1, height: 80, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginHorizontal: 3, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', overflow: 'hidden' },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  addText: { color: '#F58220', fontWeight: 'bold', fontSize: 12 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: { backgroundColor: '#0a9d5c', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});
