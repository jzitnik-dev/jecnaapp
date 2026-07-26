import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack initialRouteName="drawer">
      <Stack.Screen
        name="drawer"
        options={{ headerShown: false, title: 'Zpět' }}
      />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}
