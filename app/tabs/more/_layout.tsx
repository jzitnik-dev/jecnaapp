import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function MoreLayout() {
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
          title: 'Více',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="novinky"
        options={{
          title: 'Novinky',
        }}
      />
      <Stack.Screen
        name="substitution"
        options={{
          title: 'Mimořádný rozvrh',
        }}
      />
      <Stack.Screen
        name="teachers-list"
        options={{
          title: 'Učitelé',
        }}
      />
      <Stack.Screen
        name="rooms-list"
        options={{
          title: 'Učebny',
        }}
      />
      <Stack.Screen
        name="prichody"
        options={{
          title: 'Příchody a odchody',
        }}
      />
      <Stack.Screen
        name="omluvny-list"
        options={{
          title: 'Omluvný list',
        }}
      />
      <Stack.Screen
        name="jidelna"
        options={{
          title: 'Jídelna',
        }}
      />
      <Stack.Screen
        name="burza"
        options={{
          title: 'Burza',
        }}
      />
      <Stack.Screen
        name="teachers/[teacher]"
        options={{
          title: 'Učitel',
        }}
      />
      <Stack.Screen
        name="ucebna/[code]"
        options={{
          title: 'Učebna',
        }}
      />
      <Stack.Screen
        name="dokumenty"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
