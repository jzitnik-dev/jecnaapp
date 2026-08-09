import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { DrawerToggleButton } from '@/components/ui/DrawerToggleButton';

export default function DokumentyLayout() {
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
          title: 'Dokumenty',
          headerLeft: () => <DrawerToggleButton />,
        }}
      />
      <Stack.Screen
        name="[...path]"
        options={{
          title: 'Dokumenty',
        }}
      />
    </Stack>
  );
}
