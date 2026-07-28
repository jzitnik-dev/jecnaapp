import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Drawer,
  DrawerContentScrollView,
  DrawerItemList,
} from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { Linking, TouchableOpacity, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import { ImageViewer } from '../../../components/ImageViewer';
import { useAccountInfo } from '../../../hooks/useAccountInfo';
import { useAppTheme } from '../../../hooks/useAppTheme';
import MoodleIcon from '@/components/icons/Moodle';
import useIsUpdateAvailable from '@/utils/updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSecureStore } from '@/hooks/useSecureStore';

export default function DrawerLayout() {
  const { navigationTheme } = useAppTheme();
  const theme = useTheme();
  const { accountInfo } = useAccountInfo();
  const router = useRouter();
  const [hideProfilePicture] = useSecureStore<boolean>('hide-profilepicture', {
    initialValue: false,
    parse: val => val === 'true',
    stringify: val => (val ? 'true' : 'false'),
  });
  const showProfilePicture = !hideProfilePicture;

  const insets = useSafeAreaInsets();

  const [extraEnabled] = useSecureStore<boolean>(
    'extraordinary_schedule_enabled',
    {
      initialValue: true,
      parse: val => val === 'true',
      stringify: val => (val ? 'true' : 'false'),
    }
  );

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
      name: 'Jídelna',
      url: 'https://strav.nasejidelna.cz/0341/',
      icon: (
        <Ionicons
          name="restaurant-outline"
          size={24}
          color={navigationTheme.colors.text}
        />
      ),
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
    <Drawer
      initialRouteName="index"
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <TouchableOpacity
            onPress={navigation.openDrawer}
            accessibilityRole="button"
            accessibilityLabel="Otevřít menu"
          >
            <View style={{ marginLeft: 13, marginRight: 13 }}>
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
                      'https://github.com/jzitnik-dev/jecnaapp/releases/latest'
                    )
                  }
                  borderless={false}
                  rippleColor={`${navigationTheme.colors.onBackground}50`}
                  style={{
                    paddingVertical: 15,
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
                          fontSize: 16,
                        }}
                      >
                        Aktualizace k dispozici
                      </Text>
                      <Text
                        style={{
                          color: theme?.colors?.onSurfaceVariant,
                          fontWeight: '600',
                          fontSize: 13,
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
                  overflow: 'hidden',
                }}
              >
                <TouchableRipple
                  onPress={() => Linking.openURL(page.url)}
                  borderless={false}
                  rippleColor={`${navigationTheme.colors.onBackground}50`}
                  style={{
                    paddingVertical: 15,
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
                          fontSize: 16,
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

          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: navigationTheme.colors.border,
              paddingBottom: insets.bottom + 8,
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
                      imageUrl={accountInfo?.profilePicturePath}
                      size={48}
                      fallbackSource={require('../../../assets/images/icon.png')}
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
                    {accountInfo?.username || ''} •{' '}
                    {accountInfo?.className || ''} • {accountInfo?.classGroups}
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
        name="index"
        options={{
          title: 'Domov',
          drawerIcon: ({ color, size }) => (
            <IconSymbol size={size} name="house.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="rozvrh"
        options={{
          title: 'Rozvrh',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="znamky"
        options={{
          title: 'Známky',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="teachers-list"
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
        options={{
          title: 'Učebny',
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="door" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="prichody"
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
        options={{
          title: 'Jídelna',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="novinky"
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
        options={{
          title: 'Nastavení',
          headerShown: true,
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Drawer>
  );
}
