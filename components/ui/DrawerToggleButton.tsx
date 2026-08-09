import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

export function DrawerToggleButton() {
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
