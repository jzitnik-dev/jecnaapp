import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import { ImageViewer } from '../../components/ImageViewer';
import { useAccountInfo } from '../../hooks/useAccountInfo';
import { useAppTheme } from '../../hooks/useAppTheme';
import HomeScreen from './home';
import JidelnaScreen from './jidelna';
import OmluvnyListScreen from './omluvny-list';
import PrichodyScreen from './prichody';
import RoomsListScreen from './rooms-list';
import RozvrhScreen from './rozvrh';
import SettingsScreen from './settings';
import TeachersListScreen from './teachers-list';
import ZnamkyScreen from './znamky';
import MoodleIcon from '@/components/icons/Moodle';
import * as SecureStore from 'expo-secure-store';
import NovinkyScreen from './novinky';
import useIsUpdateAvailable from '@/utils/updates';

const Drawer = createDrawerNavigator();

export default function DrawerLayout() {
  const { navigationTheme } = useAppTheme();
  const theme = useTheme();
  const { accountInfo } = useAccountInfo();
  const router = useRouter();
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  useEffect(() => {
    (async () => {
      setShowProfilePicture(
        !((await SecureStore.getItemAsync('hide-profilepicture')) === 'true')
      );
    })();
  }, []);

  const handleAccountPress = () => {
    router.push('/settings/account');
  };

  const pages = [
    {
      name: 'Mimořádný rozvrh',
      url: 'https://www.spsejecna.cz/suplovani',
      icon: (
        <Ionicons
          name="calendar"
          size={24}
          color={navigationTheme.colors.text}
        />
      ),
    },
    {
      name: 'Moodle',
      url: 'https://moodle.spsejecna.cz',
      icon: <MoodleIcon color={navigationTheme.colors.text} />,
    },
    {
      name: 'Originální stránky',
      url: 'https://spsejecna.cz',
      icon: (
        <MaterialCommunityIcons
          name="web"
          size={24}
          color={navigationTheme.colors.text}
        />
      ),
    },
  ];

  const isUpdateAvailable = useIsUpdateAvailable();

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <TouchableOpacity
            onPress={navigation.openDrawer}
            style={{ marginLeft: 13, marginRight: 13 }}
            accessibilityRole="button"
            accessibilityLabel="Otevřít menu"
          >
            <View>
              <Ionicons
                name="menu"
                size={25}
                color={navigationTheme.colors.text}
              />
              {isUpdateAvailable && (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 0,
                    width: 8,
                    height: 8,
                    borderRadius: 10,
                    backgroundColor: navigationTheme.colors.primary,
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: navigationTheme.colors.card,
        },
        headerTintColor: navigationTheme.colors.text,
        drawerStyle: {
          backgroundColor: navigationTheme.colors.card,
        },
        drawerActiveTintColor: navigationTheme.colors.primary,
        drawerInactiveTintColor: navigationTheme.colors.text,
      })}
      drawerContent={props => (
        <>
          <DrawerContentScrollView {...props}>
            {isUpdateAvailable && (
              <View
                style={{
                  borderRadius: 9999,
                  overflow: 'hidden',
                  marginBottom: 10,
                }}
              >
                <TouchableRipple
                  onPress={() =>
                    Linking.openURL(
                      'https://github.com/jzitnik-dev/jecnamobile/releases/latest'
                    )
                  }
                  borderless={false}
                  rippleColor={`${navigationTheme.colors.onBackground}50`}
                  style={{
                    paddingVertical: 15, // match drawer item height (around 48px total)
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={24}
                      color={navigationTheme.colors.text}
                    />
                    <View style={{ marginLeft: 12 }}>
                      <Text
                        style={{
                          color: navigationTheme.colors.text,
                          fontWeight: '600',
                          fontSize: 16, // match drawer font size
                        }}
                      >
                        Aktualizace k dispozici
                      </Text>
                      <Text
                        style={{
                          color: theme?.colors?.onSurfaceVariant,
                          fontWeight: '600',
                          fontSize: 13, // match drawer font size
                        }}
                      >
                        Nová verze aplikace je k dispozici na GitHubu.
                      </Text>
                    </View>
                  </View>
                </TouchableRipple>
              </View>
            )}

            <DrawerItemList {...props} />

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: navigationTheme.colors.border,
                marginVertical: 8,
                marginHorizontal: 16,
              }}
            />

            {pages.map((page, idx) => (
              <View
                key={idx}
                style={{
                  borderRadius: 9999,
                  overflow: 'hidden', // important to clip ripple
                }}
              >
                <TouchableRipple
                  onPress={() => Linking.openURL(page.url)}
                  borderless={false}
                  rippleColor={`${navigationTheme.colors.onBackground}50`}
                  style={{
                    paddingVertical: 15, // match drawer item height (around 48px total)
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      {page.icon}
                      <Text
                        style={{
                          marginLeft: 12,
                          color: navigationTheme.colors.text,
                          fontWeight: '600',
                          fontSize: 16, // match drawer font size
                        }}
                      >
                        {page.name}
                      </Text>
                    </View>

                    <Ionicons
                      name="open-outline"
                      size={20}
                      color={navigationTheme.colors.text}
                    />
                  </>
                </TouchableRipple>
              </View>
            ))}
          </DrawerContentScrollView>

          {/* Account Section */}
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: navigationTheme.colors.border,
            }}
          >
            <TouchableRipple onPress={handleAccountPress}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {showProfilePicture && (
                  <View style={{ marginRight: 12 }}>
                    <ImageViewer
                      imageUrl={accountInfo?.photoUrl}
                      size={48}
                      fallbackSource={require('../../assets/images/icon.png')}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    variant="titleMedium"
                    style={{
                      color: navigationTheme.colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {accountInfo?.fullName || 'Načítání...'}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: navigationTheme.colors.text,
                      opacity: 0.7,
                    }}
                  >
                    {accountInfo?.username || ''} • {accountInfo?.class || ''} •{' '}
                    {accountInfo?.groups}
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
          title: 'Domov',
          drawerIcon: ({ color, size }) => (
            <IconSymbol size={size} name="house.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Rozvrh"
        component={RozvrhScreen}
        options={{
          title: 'Rozvrh',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Známky"
        component={ZnamkyScreen}
        options={{
          title: 'Známky',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="teachers-list"
        component={TeachersListScreen}
        options={{
          title: 'Učitelé',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-multiple"
              color={color}
              size={size}
            />
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
            <MaterialCommunityIcons
              name="login-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="omluvny-list"
        component={OmluvnyListScreen}
        options={{
          title: 'Omluvný list',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="jidelna"
        component={JidelnaScreen}
        options={{
          title: 'Jídelna',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="novinky"
        component={NovinkyScreen}
        options={{
          title: 'Novinky',
          headerShown: true,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="newspaper" color={color} size={size} />
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
