import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import React from 'react';
import { IconButton } from 'react-native-paper';

import HomeScreen from './index';
import RozvrhScreen from './rozvrh';
import ZnamkyScreen from './znamky';

const Drawer = createDrawerNavigator();

type DrawerMenuButtonProps = {
  navigation: DrawerNavigationProp<any>;
};

function DrawerMenuButton({ navigation }: DrawerMenuButtonProps) {
  return (
    <IconButton
      icon="menu"
      size={24}
      onPress={() => navigation.openDrawer()}
      style={{ marginLeft: 8 }}
    />
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => {
        const scheme: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';
        return {
          headerStyle: { backgroundColor: Colors[scheme].background },
          headerTintColor: Colors[scheme].text,
          headerLeft: () => <DrawerMenuButton navigation={navigation} />,
        };
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => <IconSymbol size={size} name="house.fill" color={color} />,
        }}
      />
      <Drawer.Screen
        name="Rozvrh"
        component={RozvrhScreen}
        options={{
          title: 'Rozvrh',
          drawerIcon: ({ color, size }) => <IconSymbol size={size} name="chevron.left.forwardslash.chevron.right" color={color} />,
        }}
      />
      <Drawer.Screen
        name="Známky"
        component={ZnamkyScreen}
        options={{
          title: 'Známky',
          drawerIcon: ({ color, size }) => <IconSymbol size={size} name="paperplane.fill" color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}
