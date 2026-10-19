import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="screens/AddCarScreen" />
      <Stack.Screen name="screens/PartnersScreen" />
      <Stack.Screen name="screens/PartnerDetailsScreen" />
      <Stack.Screen name="screens/ExpensesScreen" />
      <Stack.Screen name="screens/CarDetailsScreen" />
    </Stack>
  );
}
