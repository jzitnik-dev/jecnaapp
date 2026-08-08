import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { useAccountInfo } from '@/hooks/useAccountInfo';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ImageViewer } from '@/components/ImageViewer';
import MoodleIcon from '@/components/icons/Moodle';
import useIsUpdateAvailable from '@/utils/updates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ListGroup = ({ children }: { children: React.ReactNode }) => {
  const { navigationTheme } = useAppTheme();
  return (
    <View
      style={[
        styles.listGroup,
        { backgroundColor: navigationTheme.colors.card },
      ]}
    >
      {children}
    </View>
  );
};

const ListItem = ({
  icon,
  title,
  subtitle,
  onPress,
  isLast = false,
  showChevron = true,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
  showChevron?: boolean;
}) => {
  const { navigationTheme } = useAppTheme();
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={styles.listItemContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemIcon}>{icon}</View>
        <View style={styles.listItemTextContainer}>
          <Text
            style={[
              styles.listItemTitle,
              { color: navigationTheme.colors.text },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.listItemSubtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </View>
      {!isLast && (
        <View
          style={[
            styles.divider,
            { backgroundColor: navigationTheme.colors.border },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

// 3. MAIN SCREEN COMPONENT
export default function MoreScreen() {
  const { navigationTheme } = useAppTheme();
  const theme = useTheme();
  const { accountInfo } = useAccountInfo();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [extraEnabled, setExtraEnabled] = useState(false);
  const isUpdateAvailable = useIsUpdateAvailable();

  useEffect(() => {
    (async () => {
      setShowProfilePicture(
        !((await SecureStore.getItemAsync('hide-profilepicture')) === 'true')
      );
      setExtraEnabled(
        (await SecureStore.getItemAsync('extraordinary_schedule_enabled')) ===
        'true'
      );
    })();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Profile Section */}
      <TouchableOpacity
        style={[
          styles.profileSection,
          { backgroundColor: navigationTheme.colors.card },
        ]}
        onPress={() => router.push('/settings/account')}
        activeOpacity={0.7}
      >
        {showProfilePicture && (
          <View style={styles.profileImage}>
            <ImageViewer
              imageUrl={accountInfo?.profilePicturePath}
              size={60}
              fallbackSource={require('../../../assets/images/icon.png')}
            />
          </View>
        )}
        <View style={styles.profileText}>
          <Text
            variant="titleLarge"
            style={[styles.profileName, { color: navigationTheme.colors.text }]}
          >
            {accountInfo?.fullName || 'Načítání...'}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {accountInfo?.username || ''} • {accountInfo?.className || ''} •{' '}
            {accountInfo?.classGroups || ''}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {/* Update Available */}
      {isUpdateAvailable && (
        <View style={styles.section}>
          <ListGroup>
            <ListItem
              icon={
                <Ionicons
                  name="cloud-upload-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              }
              title="Aktualizace k dispozici"
              subtitle="Nová verze aplikace je k dispozici."
              onPress={() =>
                Linking.openURL(
                  'https://github.com/jzitnik-dev/jecnaapp/releases/latest'
                )
              }
              isLast={true}
            />
          </ListGroup>
        </View>
      )}

      {/* Main Links */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Škola
        </Text>
        <ListGroup>
          <ListItem
            icon={
              <Ionicons
                name="newspaper"
                size={24}
                color={theme.colors.primary}
              />
            }
            title="Novinky"
            onPress={() => router.push('/drawer/novinky')}
          />
          {extraEnabled && (
            <ListItem
              icon={
                <Ionicons
                  name="warning"
                  size={24}
                  color={theme.colors.primary}
                />
              }
              title="Mimořádný rozvrh"
              onPress={() => router.push('/drawer/substitution')}
            />
          )}
          <ListItem
            icon={
              <Ionicons name="people" size={24} color={theme.colors.primary} />
            }
            title="Učitelé"
            onPress={() => router.push('/drawer/teachers-list')}
          />
          <ListItem
            icon={
              <Ionicons
                name="business"
                size={24}
                color={theme.colors.primary}
              />
            }
            title="Učebny"
            onPress={() => router.push('/drawer/rooms-list')}
          />
          <ListItem
            icon={
              <Ionicons name="log-in" size={24} color={theme.colors.primary} />
            }
            title="Příchody a odchody"
            onPress={() => router.push('/drawer/prichody')}
          />
          <ListItem
            icon={
              <Ionicons
                name="document-text"
                size={24}
                color={theme.colors.primary}
              />
            }
            title="Omluvný list"
            onPress={() => router.push('/drawer/omluvny-list')}
          />
          <ListItem
            icon={
              <Ionicons name="folder" size={24} color={theme.colors.primary} />
            }
            title="Dokumenty"
            onPress={() => router.push('/drawer/dokumenty')}
            isLast={Platform.OS === 'ios'}
          />
        </ListGroup>
      </View>

      {/* External Links */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Externí odkazy
        </Text>
        <ListGroup>
          <ListItem
            icon={
              <Ionicons
                name="calendar-outline"
                size={24}
                color={theme.colors.primary}
              />
            }
            title="Mimořádný rozvrh"
            onPress={() =>
              Linking.openURL('https://www.spsejecna.cz/suplovani')
            }
          />
          <ListItem
            icon={<MoodleIcon color={theme.colors.primary} />}
            title="Moodle"
            onPress={() => Linking.openURL('https://moodle.spsejecna.cz')}
          />
          <ListItem
            icon={
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={theme.colors.primary}
              />
            }
            title="Jídelna"
            onPress={() =>
              Linking.openURL('https://strav.nasejidelna.cz/0341/')
            }
          />
          <ListItem
            icon={
              <MaterialCommunityIcons
                name="web"
                size={24}
                color={theme.colors.primary}
              />
            }
            title="Originální stránky"
            onPress={() => Linking.openURL('https://spsejecna.cz')}
            isLast={true}
          />
        </ListGroup>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <ListGroup>
          <ListItem
            icon={
              <Ionicons
                name="settings"
                size={24}
                color={theme.colors.primary}
              />
            }
            title="Nastavení"
            onPress={() => router.push('/settings')}
            isLast={true}
          />
        </ListGroup>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  profileImage: {
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 32,
    marginBottom: 8,
  },
  listGroup: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listItemContainer: {
    backgroundColor: 'transparent',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listItemIcon: {
    width: 36,
    alignItems: 'flex-start',
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
});
