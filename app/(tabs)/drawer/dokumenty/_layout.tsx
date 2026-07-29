import { Ionicons } from '@expo/vector-icons';
import { Stack, useNavigation } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../../../hooks/useAppTheme';

function DrawerToggleButton() {
  const navigation = useNavigation();
  const { navigationTheme } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={() => {
        (navigation as any).getParent()?.openDrawer();
      }}
      accessibilityRole="button"
      accessibilityLabel="Otevřít menu"
    >
      <View style={{ marginLeft: -4, marginRight: 10 }}>
        <Ionicons name="menu" size={25} color={navigationTheme.colors.text} />
      </View>
    </TouchableOpacity>
  );
}

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
