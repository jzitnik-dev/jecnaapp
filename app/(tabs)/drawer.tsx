import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Button } from 'react-native-paper';
import { useSpseJecnaClient } from '../../hooks/useSpseJecnaClient';
import HomeScreen from './home';
import PrichodyScreen from './prichody';
import RoomsListScreen from './rooms-list';
import RozvrhScreen from './rozvrh';
import TeachersListScreen from './teachers-list';
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
      <Drawer.Screen
        name="teachers-list"
        component={TeachersListScreen}
        options={{
          title: 'Učitelé',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="rooms-list"
        component={RoomsListScreen}
        options={{
          title: 'Učebny',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="door" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="prichody"
        component={PrichodyScreen}
        options={{
          title: 'Příchody a odchody',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="login-variant" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
} 