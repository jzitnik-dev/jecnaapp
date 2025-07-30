import { Stack } from 'expo-router';
import { useAppTheme } from '../../../hooks/useAppTheme';

export default function SettingsLayout() {
  const { navigationTheme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: navigationTheme.colors.card,
        },
        headerTintColor: navigationTheme.colors.text,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Nastavení',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          title: 'Účet',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifikace',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          title: 'Vzhled',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="extraordinarySchedule"
        options={{
          title: 'Mimořádný rozvrh',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'O aplikaci',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
