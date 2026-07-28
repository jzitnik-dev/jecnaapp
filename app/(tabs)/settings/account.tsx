import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { ImageViewer } from '../../../components/ImageViewer';
import { useAccountInfo } from '../../../hooks/useAccountInfo';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useSecureStore } from '@/hooks/useSecureStore';
import { JecnaAPI } from 'jecnaapi-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PREVIOUS_GRADES_KEY } from '@/services/GradeNotificationService';
import * as SecureStore from 'expo-secure-store';

export default function AccountScreen() {
  const theme = useTheme();
  const { currentTheme: appTheme } = useAppTheme();
  const { accountInfo, loading, error, refresh } = useAccountInfo();
  const [hideProfilePicture] = useSecureStore<boolean>('hide-profilepicture', {
    initialValue: false,
    parse: val => val === 'true',
    stringify: val => (val ? 'true' : 'false'),
  });

  const showProfilePicture = !hideProfilePicture;

  const handleLogout = () => {
    Alert.alert('Odhlásit se', 'Opravdu se chcete odhlásit?', [
      {
        text: 'Zrušit',
        style: 'cancel',
      },
      {
        text: 'Odhlásit',
        style: 'destructive',
        onPress: async () => {
          try {
            await JecnaAPI.logout();
            await SecureStore.deleteItemAsync('account_info');
            await SecureStore.deleteItemAsync('account_info_timestamp');
            await SecureStore.deleteItemAsync('username');
            await SecureStore.deleteItemAsync('password');
            await SecureStore.deleteItemAsync(PREVIOUS_GRADES_KEY);
            await AsyncStorage.clear();
            router.replace('/login');
          } catch (err) {
            console.error('Logout error:', err);
            Alert.alert('Chyba', 'Nepodařilo se odhlásit');
          }
        },
      },
    ]);
  };

  if (loading && !accountInfo) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.onBackground }]}
          >
            Načítání informací o účtu...
          </Text>
        </View>
      </View>
    );
  }

  if (error && !accountInfo) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Chyba při načítání: {error}
          </Text>
          <Button mode="contained" onPress={refresh} style={styles.retryButton}>
            Zkusit znovu
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Profile Header */}
      <Card
        style={[
          styles.profileCard,
          { backgroundColor: appTheme.colors.surface },
        ]}
      >
        <Card.Content style={styles.profileContent}>
          <View style={styles.profileHeader}>
            {showProfilePicture && (
              <View style={{ marginRight: 16 }}>
                <ImageViewer
                  imageUrl={accountInfo?.profilePicturePath}
                  size={80}
                  fallbackSource={require('../../../assets/images/icon.png')}
                />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text
                variant="headlineSmall"
                style={{ color: appTheme.colors.onSurface }}
              >
                {accountInfo?.fullName || 'Načítání...'}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: appTheme.colors.onSurfaceVariant }}
              >
                {accountInfo?.className || ''} • {accountInfo?.username || ''}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Personal Information */}
      <Card style={[styles.card, { backgroundColor: appTheme.colors.surface }]}>
        <Card.Title title="Osobní údaje" titleVariant="titleMedium" />
        <Card.Content>
          <List.Item
            title="Celé jméno"
            description={accountInfo?.fullName || '-'}
            left={props => <List.Icon {...props} icon="account" />}
          />
          <Divider />
          <List.Item
            title="Uživatelské jméno"
            description={accountInfo?.username || '-'}
            left={props => <List.Icon {...props} icon="account-key" />}
          />
          <Divider />
          <List.Item
            title="Věk"
            description={accountInfo?.age || '-'}
            left={props => <List.Icon {...props} icon="cake-variant" />}
          />
          <Divider />
          <List.Item
            title="Datum narození"
            description={accountInfo?.birthDate?.toLocaleDateString('cs-CZ')}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          <Divider />
          <List.Item
            title="Místo narození"
            description={accountInfo?.birthPlace || '-'}
            left={props => <List.Icon {...props} icon="map-marker" />}
          />
          <Divider />
          <List.Item
            title="Telefon"
            description={accountInfo?.phoneNumbers.join(', ')}
            left={props => <List.Icon {...props} icon="phone" />}
          />
          <Divider />
          <List.Item
            title="Adresa"
            description={accountInfo?.permanentAddress || '-'}
            left={props => <List.Icon {...props} icon="home" />}
          />
          <Divider />
          <List.Item
            title="Třída"
            description={accountInfo?.className || '-'}
            left={props => <List.Icon {...props} icon="school" />}
          />
          <Divider />
          <List.Item
            title="Skupiny"
            description={accountInfo?.classGroups || '-'}
            left={props => <List.Icon {...props} icon="account-group" />}
          />
          <Divider />
          <List.Item
            title="Číslo v třídním výkazu"
            description={accountInfo?.classRegistryId || '-'}
            left={props => <List.Icon {...props} icon="numeric" />}
          />
        </Card.Content>
      </Card>

      {/* Contact Information */}
      <Card style={[styles.card, { backgroundColor: appTheme.colors.surface }]}>
        <Card.Title title="Kontaktní údaje" titleVariant="titleMedium" />
        <Card.Content>
          <List.Item
            title="Soukromý e-mail"
            description={accountInfo?.privateMail || '-'}
            left={props => <List.Icon {...props} icon="email" />}
          />
          <Divider />
          <List.Item
            title="Školní e-mail"
            description={accountInfo?.schoolMail || '-'}
            left={props => <List.Icon {...props} icon="email-outline" />}
          />
        </Card.Content>
      </Card>

      {/* Parents Information */}
      {accountInfo?.guardians && accountInfo.guardians.length > 0 && (
        <Card
          style={[styles.card, { backgroundColor: appTheme.colors.surface }]}
        >
          <Card.Title
            title="Rodiče a zákonní zástupci"
            titleVariant="titleMedium"
          />
          <Card.Content>
            {accountInfo.guardians.map((parent, index) => (
              <React.Fragment key={index}>
                <List.Item
                  title={parent.name}
                  description={`${parent.phoneNumber} • ${parent.email}`}
                  left={props => <List.Icon {...props} icon="account-child" />}
                />
                {index < accountInfo.guardians.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* SPOSA Information */}
      <Card style={[styles.card, { backgroundColor: appTheme.colors.surface }]}>
        <Card.Title title="SPOSA" titleVariant="titleMedium" />
        <Card.Content>
          <List.Item
            title="Variabilní symbol"
            description={accountInfo?.sposaVariableSymbol || '-'}
            left={props => <List.Icon {...props} icon="credit-card" />}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: theme.colors.error }]}
          textColor={theme.colors.error}
          icon="logout"
        >
          Odhlásit se
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileContent: {
    paddingVertical: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  logoutContainer: {
    padding: 16,
    paddingTop: 8,
  },
  logoutButton: {
    borderWidth: 2,
  },
});
