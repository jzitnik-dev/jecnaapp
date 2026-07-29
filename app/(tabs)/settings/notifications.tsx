import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationSettings } from '@/hooks/useNotifications';
import { useBackgroundTask } from '@/hooks/useBackgroundTask';
import {
  BACKGROUND_GRADE_TASK,
  registerBackgroundGradeCheck,
} from '@/services/grades/backgroundTask';
import { testNotification } from '@/services/grades/gradeNotifications';
import { useAsyncStorage } from '@/hooks/useAsyncStorage';
import { KEY } from '@/services/grades/gradeCache';
import checkGradesDefaultFetch from '@/services/grades/defaultFetch';
import { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import NotificationDebug from '@/components/ui/NotificationDebug';
import { useBatterySettings } from '@/hooks/useBattery';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const [debug, setDebug] = useState(false);

  const { hasPermission, canAskAgain, showSuccess, handleRequestPermissions } =
    useNotificationSettings();

  const { openBatterySettings } = useBatterySettings();

  const gradeBackgroundTask = useBackgroundTask({
    taskName: BACKGROUND_GRADE_TASK,
    onRegister: registerBackgroundGradeCheck,
  });

  const [gradeLastCheckedTimestamp] = useAsyncStorage(KEY, {
    initialValue: undefined,
    parse: string => {
      const parse = JSON.parse(string);
      if (parse?.timestamp) {
        return new Date(parse.timestamp);
      }
      return undefined;
    },
  });

  const navigation = useNavigation();

  const isDebugMode =
    process.env.EXPO_PUBLIC_ENABLE_DEBUG_MENU === 'true' || __DEV__;

  useEffect(() => {
    if (isDebugMode) {
      navigation.setOptions({
        headerRight: () => (
          <View
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <TouchableOpacity
              style={{
                borderRadius: 4,
                paddingVertical: 15,
                paddingHorizontal: 15,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onPress={() => setDebug(true)}
            >
              <Ionicons
                name="bug-outline"
                size={25}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, theme]);

  return (
    <>
      <NotificationDebug modalVisible={debug} setModalVisible={setDebug} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Notifikace
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Spravujte, jak vás aplikace bude informovat o důležitých
              událostech.
            </Text>

            {hasPermission !== null && (!hasPermission || showSuccess) && (
              <View style={styles.statusSection}>
                {!hasPermission ? (
                  <View
                    style={[
                      styles.alertBanner,
                      { backgroundColor: theme.colors.errorContainer },
                    ]}
                  >
                    <View style={styles.bannerHeader}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={24}
                        color={theme.colors.error}
                      />
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.bannerText,
                          { color: theme.colors.error },
                        ]}
                      >
                        Notifikace jsou vypnuté
                      </Text>
                    </View>

                    <Text
                      variant="bodySmall"
                      style={[
                        styles.bannerSubtext,
                        { color: theme.colors.onErrorContainer },
                      ]}
                    >
                      {canAskAgain !== false
                        ? 'Pro správné fungování aplikace a příjem upozornění prosím povolte notifikace.'
                        : 'Notifikace jste dříve zamítli. Pro jejich zapnutí musíte přejít do nastavení zařízení.'}
                    </Text>

                    <Button
                      mode="contained"
                      icon={() => (
                        <Ionicons
                          name={
                            canAskAgain !== false
                              ? 'notifications-outline'
                              : 'settings-outline'
                          }
                          size={18}
                          color={theme.colors.onError}
                        />
                      )}
                      onPress={handleRequestPermissions}
                      buttonColor={theme.colors.error}
                      textColor={theme.colors.onError}
                      style={styles.button}
                    >
                      {canAskAgain !== false ? 'Povolit' : 'Otevřít nastavení'}
                    </Button>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.alertBanner,
                      { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <View style={styles.bannerHeader}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.bannerText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Vše je připraveno
                      </Text>
                    </View>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.bannerSubtext,
                        { color: theme.colors.onPrimaryContainer },
                      ]}
                    >
                      Notifikace jsou povoleny. Budete dostávat všechna důležitá
                      upozornění.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {Platform.OS === 'android' && (
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Content>
              <View style={styles.bannerHeader}>
                <Ionicons
                  name="battery-half-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  variant="titleMedium"
                  style={[styles.bannerText, { color: theme.colors.onSurface }]}
                >
                  Spolehlivost notifikací
                </Text>
              </View>

              <Text
                variant="bodySmall"
                style={[
                  styles.description,
                  { color: theme.colors.onSurfaceVariant, marginBottom: 12 },
                ]}
              >
                Android často ukončuje aplikace na pozadí, pokud je ze seznamu
                spuštěných aplikací odstraníte (tzv. "swipe away"). Aby kontrola
                známek fungovala spolehlivě i v těchto případech, je nutné v
                nastavení telefonu povolit aplikaci "Neomezené" (Unrestricted)
                využití baterie.
              </Text>

              <Button
                mode="outlined"
                icon="cog"
                onPress={openBatterySettings}
                textColor={theme.colors.primary}
                style={{ alignSelf: 'flex-start', borderRadius: 8 }}
              >
                Nastavení baterie pro aplikaci
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Grade Notifications & Background Task Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurface }}
                >
                  Nové známky
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Pravidelně na pozadí kontroluje nové známky a změny v
                  klasifikaci.
                </Text>
              </View>

              {gradeBackgroundTask.isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Switch
                  value={gradeBackgroundTask.isRegistered}
                  onValueChange={gradeBackgroundTask.toggleTask}
                  disabled={gradeBackgroundTask.isLoading}
                  color={theme.colors.primary}
                />
              )}
            </View>

            {/* Action Buttons & Status (Visible when background check is enabled) */}
            {gradeBackgroundTask.isRegistered && (
              <View style={styles.actionsContainer}>
                <View style={styles.buttonGroup}>
                  <Button
                    mode="outlined"
                    compact
                    icon={({ size, color }) => (
                      <Ionicons
                        name="notifications-outline"
                        size={size}
                        color={color}
                      />
                    )}
                    onPress={() => {
                      testNotification();
                    }}
                    style={styles.actionButton}
                  >
                    Otestovat notifikaci
                  </Button>

                  <Button
                    mode="contained-tonal"
                    compact
                    icon={({ size, color }) => (
                      <Ionicons
                        name="refresh-outline"
                        size={size}
                        color={color}
                      />
                    )}
                    onPress={() => {
                      checkGradesDefaultFetch();
                    }}
                    style={styles.actionButton}
                  >
                    Zkontrolovat nové známky
                  </Button>
                </View>

                <Text
                  variant="labelSmall"
                  style={[
                    styles.lastCheckedText,
                    { color: theme.colors.outline },
                  ]}
                >
                  Naposledy zkontrolováno:{' '}
                  {gradeLastCheckedTimestamp?.toLocaleString('cs-CZ') || '-'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    lineHeight: 20,
  },
  statusSection: {
    marginTop: 16,
  },
  alertBanner: {
    padding: 16,
    borderRadius: 12,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerText: {
    marginLeft: 10,
    fontWeight: '600',
  },
  bannerSubtext: {
    marginBottom: 4,
    lineHeight: 18,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  actionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  lastCheckedText: {
    fontStyle: 'italic',
  },
});
