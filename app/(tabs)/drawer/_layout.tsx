import {
  Drawer,
  DrawerContentScrollView,
  DrawerItemList,
} from 'expo-router/drawer';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useRouter } from 'expo-router';
import { Linking, TouchableOpacity, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ImageViewer } from '../../../components/ImageViewer';
import { useAccountInfo } from '../../../hooks/useAccountInfo';
import { useAppTheme } from '../../../hooks/useAppTheme';
import MoodleIcon from '@/components/icons/Moodle';
import useIsUpdateAvailable from '@/utils/updates';
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { useSecureStore } from '@/hooks/useSecureStore';

export default function DynamicLayout() {
  const { navigationTheme } = useAppTheme();
  const theme = useTheme();
  const { accountInfo } = useAccountInfo();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isUpdateAvailable = useIsUpdateAvailable();

  const [hideProfilePicture] = useSecureStore<boolean>('hide-profilepicture', {
    initialValue: false,
    parse: val => val === 'true',
    stringify: val => (val ? 'true' : 'false'),
  });
  const showProfilePicture = !hideProfilePicture;

  const [extraEnabled] = useSecureStore<boolean>(
    'extraordinary_schedule_enabled',
    {
      initialValue: true,
      parse: val => val === 'true',
      stringify: val => (val ? 'true' : 'false'),
    }
  );

  const [layoutType] = useSecureStore<'drawer' | 'tab'>('drawer-layout', {
    initialValue: 'drawer',
    parse: val => (val === 'tab' ? 'tab' : 'drawer'),
    stringify: val => (val === 'tab' ? 'tab' : 'drawer'),
  });

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

  // ==========================================
  // NATIVE TABS LAYOUT
  // ==========================================
  if (layoutType === 'tab') {
    return (
      <SafeAreaView
        edges={['top']}
        style={{ flex: 1, backgroundColor: navigationTheme.colors.background }}
      >
        <NativeTabs tabBarRespectsIMEInsets={false}>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Domov</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: 'house', selected: 'house.fill' }}
              md="home"
            />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="rozvrh">
            <NativeTabs.Trigger.Label>Rozvrh</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: 'calendar', selected: 'calendar' }}
              md="calendar_month"
            />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="znamky">
            <NativeTabs.Trigger.Label>Známky</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: 'star', selected: 'star.fill' }}
              md="star"
            />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="more">
            <NativeTabs.Trigger.Label>Více</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{
                default: 'ellipsis.circle',
                selected: 'ellipsis.circle.fill',
              }}
              md="more_horiz"
            />
          </NativeTabs.Trigger>

          {/* Hide secondary screens from the tab bar */}
          <NativeTabs.Trigger name="novinky" hidden />
          <NativeTabs.Trigger name="omluvny-list" hidden />
          <NativeTabs.Trigger name="prichody" hidden />
          <NativeTabs.Trigger name="rooms-list" hidden />
          <NativeTabs.Trigger name="teacher-absences" hidden />
          <NativeTabs.Trigger name="teachers-list" hidden />
          <NativeTabs.Trigger name="settings" hidden />
          <NativeTabs.Trigger name="teachers" hidden />
          <NativeTabs.Trigger name="ucebna" hidden />
          <NativeTabs.Trigger name="substitution" hidden />
          <NativeTabs.Trigger name="dokumenty" hidden />
        </NativeTabs>
      </SafeAreaView>
    );
  }

  // ==========================================
  // DRAWER LAYOUT (DEFAULT)
  // ==========================================
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
            <Ionicons size={size} name="home" color={color} />
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
        name="substitution"
        options={{
          title: 'Mimořádný rozvrh',
          drawerItemStyle: extraEnabled ? {} : { display: 'none' },
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
        name="dokumenty"
        options={{
          title: 'Dokumenty',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
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

      <Drawer.Screen
        name="more"
        options={{
          title: 'Více',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
