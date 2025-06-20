import { IconSymbol } from '@/components/ui/IconSymbol';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Button } from 'react-native-paper';
import { useSpseJecnaClient } from '../../hooks/useSpseJecnaClient';
import HomeScreen from './home';
import RozvrhScreen from './rozvrh';
import ZnamkyScreen from './znamky';

const Drawer = createDrawerNavigator();

export default function DrawerLayout() {
  const { client, logout: globalLogout } = useSpseJecnaClient();
  const router = useRouter();
  const handleLogout = async () => {
    if (client) {
      await client.logout();
    }
    await SecureStore.deleteItemAsync('username');
    await SecureStore.deleteItemAsync('password');
    globalLogout();
    router.replace('/login');
  };
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={props => (
        <>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={{ margin: 16, marginTop: 'auto', backgroundColor: '#fff' }}
            labelStyle={{ color: '#23272e', fontWeight: 'bold' }}
            icon="logout"
          >
            Odhlásit se
          </Button>
        </>
      )}
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