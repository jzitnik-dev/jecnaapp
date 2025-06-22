import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { ImageViewer } from '../../components/ImageViewer';
import { useAccountInfo } from '../../hooks/useAccountInfo';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSpseJecnaClient } from '../../hooks/useSpseJecnaClient';
import HomeScreen from './home';
import JidelnaScreen from './jidelna';
import OmluvnyListScreen from './omluvny-list';
import PrichodyScreen from './prichody';
import RoomsListScreen from './rooms-list';
import RozvrhScreen from './rozvrh';
import SettingsScreen from './settings';
import TeachersListScreen from './teachers-list';
import ZnamkyScreen from './znamky';

const Drawer = createDrawerNavigator();

export default function DrawerLayout() {
  const { client, logout: globalLogout } = useSpseJecnaClient();
  const { navigationTheme } = useAppTheme();
  const { accountInfo } = useAccountInfo();
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

  const handleAccountPress = () => {
    router.push('/settings/account');
  };

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: navigationTheme.colors.card,
        },
        headerTintColor: navigationTheme.colors.text,
        drawerStyle: {
          backgroundColor: navigationTheme.colors.card,
        },
        drawerActiveTintColor: navigationTheme.colors.primary,
        drawerInactiveTintColor: navigationTheme.colors.text,
      }}
      drawerContent={props => (
        <>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>
          
          {/* Account Section */}
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: navigationTheme.colors.border }}>
            <TouchableRipple onPress={handleAccountPress}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <ImageViewer
                  imageUrl={accountInfo?.photoUrl}
                  size={48}
                  fallbackSource={require('../../assets/images/icon.png')}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text 
                    variant="titleMedium" 
                    style={{ 
                      color: navigationTheme.colors.text,
                      fontWeight: '600'
                    }}
                  >
                    {accountInfo?.fullName || 'Načítání...'}
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    style={{ 
                      color: navigationTheme.colors.text,
                      opacity: 0.7
                    }}
                  >
                    {accountInfo?.class || ''} • {accountInfo?.username || ''}
                  </Text>
                </View>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={20} 
                  color={navigationTheme.colors.text} 
                />
              </View>
            </TouchableRipple>
          </View>
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
      <Drawer.Screen
        name="omluvny-list"
        component={OmluvnyListScreen}
        options={{
          title: 'Omluvný list',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-edit-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="jidelna"
        component={JidelnaScreen}
        options={{
          title: 'Jídelna',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-edit-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        component={SettingsScreen}
        options={{
          title: 'Nastavení',
          headerShown: true,
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
} 