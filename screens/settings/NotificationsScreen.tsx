import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { useAccountInfo } from '@/hooks/useAccountInfo';
import NotificationDebug from '@/components/ui/NotificationDebug';
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
import { useBatterySettings } from '@/hooks/useBattery';

const NOTIFICATION_SETTINGS_STORAGE_KEY = 'jecna_notification_settings_cache';

type DeliveryMode = 'INSTANT' | 'SMART_BATCH';
type ActiveTab = 'schedule' | 'grades';

function parseTimeStringToDate(timeStr: string): Date {
  const match = timeStr?.match(/^(\d{1,2}):(\d{2})$/);
  const date = new Date();
  if (match) {
    date.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
  } else {
    date.setHours(7, 0, 0, 0);
  }
  return date;
}

function formatDateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { username, className, accountInfo } = useAccountInfo();

  const effectiveUsername = username ?? accountInfo?.username;
  const effectiveClassName = className ?? accountInfo?.className;

  // Active section filter tab (Rozvrh vs Známky)
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');

  // Push notifications state (Opt-in: disabled by default)
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState<boolean>(false);

  // Delivery Modes & Smart preferences
  const [mode, setMode] = useState<DeliveryMode>('INSTANT');
  const [smartMorningEnabled, setSmartMorningEnabled] = useState<boolean>(true);
  const [smartMorningTime, setSmartMorningTime] = useState<string>('07:00');
  const [smartEveningEnabled, setSmartEveningEnabled] = useState<boolean>(true);
  const [smartEveningTime, setSmartEveningTime] = useState<string>('19:00');
  const [smartSchoolHoursEnabled, setSmartSchoolHoursEnabled] =
    useState<boolean>(true);

  // Picker dialog visibility (for Android)
  const [showMorningPicker, setShowMorningPicker] = useState<boolean>(false);
  const [showEveningPicker, setShowEveningPicker] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [debug, setDebug] = useState<boolean>(false);

  // Local notification permissions & battery settings
  const { hasPermission, canAskAgain, showSuccess, handleRequestPermissions } =
    useNotificationSettings();
  const { openBatterySettings } = useBatterySettings();

  // Background task for checking grades
  const gradeBackgroundTask = useBackgroundTask({
    taskName: BACKGROUND_GRADE_TASK,
    onRegister: registerBackgroundGradeCheck,
  });

  // Last checked timestamp for grades
  const [gradeLastCheckedTimestamp] = useAsyncStorage(KEY, {
    initialValue: null,
    parse: string => {
      try {
        const parsed = JSON.parse(string);
        if (parsed?.timestamp) {
          return new Date(parsed.timestamp);
        }
      } catch {
        // ignore
      }
      return null;
    },
  });

  const isDebugMode =
    process.env.EXPO_PUBLIC_ENABLE_DEBUG_MENU === 'true' || __DEV__;

  // Header debug button
  useEffect(() => {
    if (isDebugMode) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            style={styles.debugHeaderButton}
            onPress={() => setDebug(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="bug-outline"
              size={24}
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, theme, isDebugMode]);

  // Load cached push notification settings
  useEffect(() => {
    const loadCachedSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(
          NOTIFICATION_SETTINGS_STORAGE_KEY
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.mode) {
            setMode(parsed.mode === 'SMART' ? 'SMART_BATCH' : parsed.mode);
          }
          if (parsed.smartMorningEnabled !== undefined) {
            setSmartMorningEnabled(parsed.smartMorningEnabled);
          }
          if (parsed.smartMorningTime) {
            setSmartMorningTime(parsed.smartMorningTime);
          }
          if (parsed.smartEveningEnabled !== undefined) {
            setSmartEveningEnabled(parsed.smartEveningEnabled);
          }
          if (parsed.smartEveningTime) {
            setSmartEveningTime(parsed.smartEveningTime);
          }
          if (parsed.smartSchoolHoursEnabled !== undefined) {
            setSmartSchoolHoursEnabled(parsed.smartSchoolHoursEnabled);
          }
          if (parsed.pushToken) {
            setPushToken(parsed.pushToken);
          }

          if (parsed.pushEnabled) {
            const perm = await Notifications.getPermissionsAsync();
            if (perm.status === 'granted') {
              setPushEnabled(true);
            } else {
              setPushEnabled(false);
            }
          }
        }
      } catch (err) {
        console.warn('Nepodařilo se načíst uložená nastavení notifikací:', err);
      }
    };

    loadCachedSettings();
  }, []);

  // Request push notification token
  const requestPushToken = async (): Promise<string | null> => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Oprávnění zamítnuto',
        'Notifikace nejsou v systému povoleny. Povolte prosím oznámení v nastavení zařízení pro příjem upozornění.'
      );
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Výchozí',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      'fa28708e-72c2-4d2e-9a95-29f9084e995e';

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenResponse.data;
  };

  // Toggle push notifications ON/OFF
  const handleTogglePushNotifications = async (value: boolean) => {
    if (!value) {
      setPushEnabled(false);
      return;
    }

    setPushLoading(true);
    try {
      const token = await requestPushToken();
      if (token) {
        setPushToken(token);
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
      }
    } catch (error: any) {
      console.error('Nepodařilo se získat push token:', error);
      Alert.alert(
        'Chyba při zapínání notifikací',
        error?.message ||
        'Nepodařilo se získat push token zařízení. Zkontrolujte připojení k internetu.'
      );
      setPushEnabled(false);
    } finally {
      setPushLoading(false);
    }
  };

  // Save preferences to the remote API
  const handleSavePreferences = async () => {
    if (!effectiveUsername) {
      Alert.alert(
        'Chyba',
        'Informace o uživatelském účtu nejsou k dispozici. Ujistěte se, že jste přihlášeni.'
      );
      return;
    }

    let token = pushToken;
    if (!token && pushEnabled) {
      setPushLoading(true);
      try {
        token = await requestPushToken();
        if (token) {
          setPushToken(token);
        }
      } catch (err: any) {
        Alert.alert(
          'Chyba',
          err?.message || 'Nepodařilo se získat push token zařízení.'
        );
        setPushLoading(false);
        return;
      } finally {
        setPushLoading(false);
      }
    }

    if (!token) {
      Alert.alert(
        'Chyba',
        'Push token zařízení je vyžadován pro uložení nastavení. Zapněte prosím notifikace.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const userTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Prague';

      const payload = {
        userId: effectiveUsername,
        pushToken: token,
        timezone: userTimezone,
        mode, // "INSTANT" or "SMART_BATCH"
        smartMorningEnabled,
        smartMorningTime,
        smartEveningEnabled,
        smartEveningTime,
        smartSchoolHoursEnabled,
        classes: effectiveClassName ? [effectiveClassName] : [],
      };

      const response = await fetch(
        `${NOTIFICATION_SETTINGS_STORAGE_KEY}/api/notifications/user/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let serverError = `Požadavek selhal s kódem ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson?.error) {
            serverError = errorJson.error;
          }
        } catch {
          // ignore parsing error
        }
        throw new Error(serverError);
      }

      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_STORAGE_KEY,
        JSON.stringify({
          pushEnabled: true,
          pushToken: token,
          mode,
          smartMorningEnabled,
          smartMorningTime,
          smartEveningEnabled,
          smartEveningTime,
          smartSchoolHoursEnabled,
        })
      );

      Alert.alert('Úspěch', 'Předvolby notifikací byly úspěšně uloženy!');
    } catch (error: any) {
      console.error('Chyba při ukládání předvoleb notifikací:', error);
      Alert.alert(
        'Chyba při ukládání',
        error?.message ||
          'Nepodařilo se uložit nastavení notifikací. Zkuste to prosím znovu.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isDark = theme.dark;
  const cardBg = theme.colors.surface || (isDark ? '#1E1E1E' : '#FFFFFF');
  const textColor = theme.colors.onSurface || (isDark ? '#FFFFFF' : '#1A1A1A');
  const subtextColor =
    theme.colors.onSurfaceVariant || (isDark ? '#AAAAAA' : '#666666');
  const primaryColor = theme.colors.primary || '#4CAF50';
  const borderColor = isDark ? '#2D2D2D' : '#E0E0E0';
  const errorColor = theme.colors.error || '#D32F2F';

  return (
    <>
      <NotificationDebug modalVisible={debug} setModalVisible={setDebug} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Permission Banner (when disabled at system level) */}
        {hasPermission !== null && (!hasPermission || showSuccess) && (
          <View style={styles.bannerContainer}>
            {!hasPermission ? (
              <View
                style={[
                  styles.alertBanner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(211, 47, 47, 0.15)'
                      : '#FFEBEE',
                    borderColor: errorColor,
                  },
                ]}
              >
                <View style={styles.bannerHeader}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={22}
                    color={errorColor}
                  />
                  <Text
                    style={[
                      styles.bannerTitle,
                      { color: errorColor, marginLeft: 8 },
                    ]}
                  >
                    Notifikace jsou v systému vypnuté
                  </Text>
                </View>
                <Text style={[styles.bannerSubtext, { color: textColor }]}>
                  {canAskAgain !== false
                    ? 'Pro příjem upozornění prosím povolte notifikace.'
                    : 'Notifikace jste dříve zamítli. Přejděte do nastavení zařízení a povolte je.'}
                </Text>
                <TouchableOpacity
                  style={[styles.bannerButton, { backgroundColor: errorColor }]}
                  onPress={handleRequestPermissions}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      canAskAgain !== false
                        ? 'notifications-outline'
                        : 'settings-outline'
                    }
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.bannerButtonText}>
                    {canAskAgain !== false
                      ? 'Povolit notifikace'
                      : 'Otevřít nastavení'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.alertBanner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(76, 175, 80, 0.15)'
                      : '#E8F5E9',
                    borderColor: primaryColor,
                  },
                ]}
              >
                <View style={styles.bannerHeader}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color={primaryColor}
                  />
                  <Text
                    style={[
                      styles.bannerTitle,
                      { color: primaryColor, marginLeft: 8 },
                    ]}
                  >
                    Notifikace jsou povoleny
                  </Text>
                </View>
                <Text style={[styles.bannerSubtext, { color: textColor }]}>
                  Vše je připraveno pro příjem upozornění.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Section Filter Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'schedule'
                ? { backgroundColor: primaryColor }
                : {
                  backgroundColor: isDark ? '#262626' : '#EEEEEE',
                  borderColor,
                  borderWidth: 1,
                },
            ]}
            onPress={() => setActiveTab('schedule')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={activeTab === 'schedule' ? '#FFFFFF' : subtextColor}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === 'schedule' ? '#FFFFFF' : textColor },
              ]}
            >
              Změny rozvrhu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'grades'
                ? { backgroundColor: primaryColor }
                : {
                  backgroundColor: isDark ? '#262626' : '#EEEEEE',
                  borderColor,
                  borderWidth: 1,
                },
            ]}
            onPress={() => setActiveTab('grades')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="school-outline"
              size={16}
              color={activeTab === 'grades' ? '#FFFFFF' : subtextColor}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === 'grades' ? '#FFFFFF' : textColor },
              ]}
            >
              Známky
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'schedule' && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={primaryColor}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.mainSectionHeader, { color: textColor }]}>
                Změny rozvrhu a suplování
              </Text>
              {/* BETA Badge */}
              <View style={[styles.betaBadge, { backgroundColor: primaryColor }]}>
                <Text style={styles.betaBadgeText}>BETA</Text>
              </View>
            </View>

            {Platform.OS === 'android' ? (
              <>
                <View
                  style={[styles.card, { backgroundColor: cardBg, borderColor }]}
                >
                  <View style={styles.mainToggleRow}>
                    <View style={styles.mainToggleTextContainer}>
                      <Text style={[styles.mainToggleTitle, { color: textColor }]}>
                        Povolit push notifikace
                      </Text>
                      <Text
                        style={[styles.mainToggleSubtitle, { color: subtextColor }]}
                      >
                        Příjem okamžitých nebo souhrnných oznámení do tohoto
                        zařízení
                      </Text>
                    </View>
                    {pushLoading ? (
                      <ActivityIndicator size="small" color={primaryColor} />
                    ) : (
                      <Switch
                        value={pushEnabled}
                        onValueChange={handleTogglePushNotifications}
                        trackColor={{
                          false: isDark ? '#3E3E3E' : '#D1D1D6',
                          true: primaryColor,
                        }}
                        thumbColor={
                          Platform.OS === 'ios'
                            ? '#FFFFFF'
                            : pushEnabled
                              ? '#FFFFFF'
                              : '#F4F3F4'
                        }
                      />
                    )}
                  </View>
                </View>

                {pushEnabled ? (
                  <>
                    <View
                      style={[
                        styles.card,
                        { backgroundColor: cardBg, borderColor },
                      ]}
                    >
                      <Text style={[styles.sectionTitle, { color: textColor }]}>
                        Režim doručování
                      </Text>
                      <Text
                        style={[styles.sectionSubtitle, { color: subtextColor }]}
                      >
                        Zvolte, jakým způsobem chcete dostávat upozornění na změny.
                      </Text>

                      <View style={styles.modesContainer}>
                        {/* Mode 1: All (Instant) */}
                        <TouchableOpacity
                          style={[
                            styles.modeCard,
                            {
                              backgroundColor:
                                mode === 'INSTANT'
                                  ? isDark
                                    ? 'rgba(76, 175, 80, 0.15)'
                                    : 'rgba(76, 175, 80, 0.08)'
                                  : isDark
                                    ? '#252525'
                                    : '#F8F9FA',
                              borderColor:
                                mode === 'INSTANT' ? primaryColor : borderColor,
                              borderWidth: mode === 'INSTANT' ? 2 : 1,
                            },
                          ]}
                          onPress={() => setMode('INSTANT')}
                          activeOpacity={0.8}
                        >
                          <View style={styles.modeCardHeader}>
                            <View style={styles.modeTitleRow}>
                              <Ionicons
                                name="flash-outline"
                                size={20}
                                color={
                                  mode === 'INSTANT' ? primaryColor : subtextColor
                                }
                              />
                              <Text
                                style={[
                                  styles.modeCardTitle,
                                  {
                                    color:
                                      mode === 'INSTANT' ? primaryColor : textColor,
                                    fontWeight: mode === 'INSTANT' ? '700' : '600',
                                  },
                                ]}
                              >
                                Všechny (Okamžitě)
                              </Text>
                            </View>
                            <Ionicons
                              name={
                                mode === 'INSTANT'
                                  ? 'radio-button-on'
                                  : 'radio-button-off'
                              }
                              size={20}
                              color={
                                mode === 'INSTANT' ? primaryColor : subtextColor
                              }
                            />
                          </View>
                          <Text
                            style={[
                              styles.modeCardDescription,
                              { color: subtextColor },
                            ]}
                          >
                            Odesílat všechny notifikace okamžitě pro vaši třídu.
                          </Text>
                        </TouchableOpacity>

                        {/* Mode 2: Categorize (Smart Batch) */}
                        <TouchableOpacity
                          style={[
                            styles.modeCard,
                            {
                              backgroundColor:
                                mode === 'SMART_BATCH'
                                  ? isDark
                                    ? 'rgba(76, 175, 80, 0.15)'
                                    : 'rgba(76, 175, 80, 0.08)'
                                  : isDark
                                    ? '#252525'
                                    : '#F8F9FA',
                              borderColor:
                                mode === 'SMART_BATCH' ? primaryColor : borderColor,
                              borderWidth: mode === 'SMART_BATCH' ? 2 : 1,
                            },
                          ]}
                          onPress={() => setMode('SMART_BATCH')}
                          activeOpacity={0.8}
                        >
                          <View style={styles.modeCardHeader}>
                            <View style={styles.modeTitleRow}>
                              <Ionicons
                                name="layers-outline"
                                size={20}
                                color={
                                  mode === 'SMART_BATCH'
                                    ? primaryColor
                                    : subtextColor
                                }
                              />
                              <Text
                                style={[
                                  styles.modeCardTitle,
                                  {
                                    color:
                                      mode === 'SMART_BATCH'
                                        ? primaryColor
                                        : textColor,
                                    fontWeight:
                                      mode === 'SMART_BATCH' ? '700' : '600',
                                  },
                                ]}
                              >
                                Chytré souhrny
                              </Text>
                            </View>
                            <Ionicons
                              name={
                                mode === 'SMART_BATCH'
                                  ? 'radio-button-on'
                                  : 'radio-button-off'
                              }
                              size={20}
                              color={
                                mode === 'SMART_BATCH' ? primaryColor : subtextColor
                              }
                            />
                          </View>
                          <Text
                            style={[
                              styles.modeCardDescription,
                              { color: subtextColor },
                            ]}
                          >
                            Dávkovat notifikace do přehledných souhrnů v nastavený
                            čas.
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Smart Mode Toggles & Time Pickers */}
                      {mode === 'SMART_BATCH' && (
                        <View
                          style={[
                            styles.smartSection,
                            {
                              backgroundColor: isDark ? '#181818' : '#F1F3F5',
                              borderColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.smartSectionHeader,
                              { color: textColor },
                            ]}
                          >
                            Předvolby chytrých souhrnů
                          </Text>
                          <Text
                            style={[
                              styles.smartSectionSubheader,
                              { color: subtextColor },
                            ]}
                          >
                            Nastavte si čas ranního a večerního souhrnu i průběžné
                            aktualizace.
                          </Text>

                          {/* Item 1: Morning Digest */}
                          <View style={styles.smartToggleContainer}>
                            <View style={styles.smartToggleRow}>
                              <View style={styles.smartToggleIcon}>
                                <Ionicons
                                  name="sunny-outline"
                                  size={20}
                                  color={primaryColor}
                                />
                              </View>
                              <View style={styles.smartToggleText}>
                                <Text
                                  style={[
                                    styles.smartToggleTitle,
                                    { color: textColor },
                                  ]}
                                >
                                  Ranní přehled
                                </Text>
                                <Text
                                  style={[
                                    styles.smartToggleDescription,
                                    { color: subtextColor },
                                  ]}
                                >
                                  Souhrn změn před začátkem ranního vyučování
                                </Text>
                              </View>
                              <Switch
                                value={smartMorningEnabled}
                                onValueChange={setSmartMorningEnabled}
                                trackColor={{
                                  false: isDark ? '#3E3E3E' : '#D1D1D6',
                                  true: primaryColor,
                                }}
                                thumbColor={
                                  Platform.OS === 'ios'
                                    ? '#FFFFFF'
                                    : smartMorningEnabled
                                      ? '#FFFFFF'
                                      : '#F4F3F4'
                                }
                              />
                            </View>

                            {/* Morning Time Picker */}
                            {smartMorningEnabled && (
                              <View style={styles.timePickerRow}>
                                <Text
                                  style={[
                                    styles.timePickerLabel,
                                    { color: subtextColor },
                                  ]}
                                >
                                  Čas ranního souhrnu:
                                </Text>
                                {Platform.OS === 'ios' ? (
                                  <DateTimePicker
                                    value={parseTimeStringToDate(smartMorningTime)}
                                    mode="time"
                                    is24Hour
                                    display="compact"
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(_event, date) => {
                                      if (date) {
                                        setSmartMorningTime(
                                          formatDateToTimeString(date)
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <>
                                    <TouchableOpacity
                                      style={[
                                        styles.timePickerButton,
                                        {
                                          borderColor,
                                          backgroundColor: isDark
                                            ? '#262626'
                                            : '#FFFFFF',
                                        },
                                      ]}
                                      onPress={() => setShowMorningPicker(true)}
                                      activeOpacity={0.7}
                                    >
                                      <Ionicons
                                        name="time-outline"
                                        size={16}
                                        color={primaryColor}
                                        style={{ marginRight: 6 }}
                                      />
                                      <Text
                                        style={[
                                          styles.timePickerButtonText,
                                          { color: textColor },
                                        ]}
                                      >
                                        {smartMorningTime}
                                      </Text>
                                    </TouchableOpacity>

                                    {showMorningPicker && (
                                      <DateTimePicker
                                        value={parseTimeStringToDate(
                                          smartMorningTime
                                        )}
                                        mode="time"
                                        is24Hour
                                        display="default"
                                        onChange={(event, date) => {
                                          setShowMorningPicker(false);
                                          if (event.type === 'set' && date) {
                                            setSmartMorningTime(
                                              formatDateToTimeString(date)
                                            );
                                          }
                                        }}
                                      />
                                    )}
                                  </>
                                )}
                              </View>
                            )}
                          </View>

                          <View
                            style={[
                              styles.innerDivider,
                              { backgroundColor: borderColor },
                            ]}
                          />

                          {/* Item 2: In-School Updates */}
                          <View style={styles.smartToggleContainer}>
                            <View style={styles.smartToggleRow}>
                              <View style={styles.smartToggleIcon}>
                                <Ionicons
                                  name="school-outline"
                                  size={20}
                                  color={primaryColor}
                                />
                              </View>
                              <View style={styles.smartToggleText}>
                                <Text
                                  style={[
                                    styles.smartToggleTitle,
                                    { color: textColor },
                                  ]}
                                >
                                  Během výuky
                                </Text>
                                <Text
                                  style={[
                                    styles.smartToggleDescription,
                                    { color: subtextColor },
                                  ]}
                                >
                                  Průběžná upozornění na změny v průběhu školního
                                  dne
                                </Text>
                              </View>
                              <Switch
                                value={smartSchoolHoursEnabled}
                                onValueChange={setSmartSchoolHoursEnabled}
                                trackColor={{
                                  false: isDark ? '#3E3E3E' : '#D1D1D6',
                                  true: primaryColor,
                                }}
                                thumbColor={
                                  Platform.OS === 'ios'
                                    ? '#FFFFFF'
                                    : smartSchoolHoursEnabled
                                      ? '#FFFFFF'
                                      : '#F4F3F4'
                                }
                              />
                            </View>
                          </View>

                          <View
                            style={[
                              styles.innerDivider,
                              { backgroundColor: borderColor },
                            ]}
                          />

                          {/* Item 3: Evening Digest */}
                          <View style={styles.smartToggleContainer}>
                            <View style={styles.smartToggleRow}>
                              <View style={styles.smartToggleIcon}>
                                <Ionicons
                                  name="moon-outline"
                                  size={20}
                                  color={primaryColor}
                                />
                              </View>
                              <View style={styles.smartToggleText}>
                                <Text
                                  style={[
                                    styles.smartToggleTitle,
                                    { color: textColor },
                                  ]}
                                >
                                  Večerní souhrn
                                </Text>
                                <Text
                                  style={[
                                    styles.smartToggleDescription,
                                    { color: subtextColor },
                                  ]}
                                >
                                  Přehled změn a rozvrhu na následující den
                                </Text>
                              </View>
                              <Switch
                                value={smartEveningEnabled}
                                onValueChange={setSmartEveningEnabled}
                                trackColor={{
                                  false: isDark ? '#3E3E3E' : '#D1D1D6',
                                  true: primaryColor,
                                }}
                                thumbColor={
                                  Platform.OS === 'ios'
                                    ? '#FFFFFF'
                                    : smartEveningEnabled
                                      ? '#FFFFFF'
                                      : '#F4F3F4'
                                }
                              />
                            </View>

                            {/* Evening Time Picker */}
                            {smartEveningEnabled && (
                              <View style={styles.timePickerRow}>
                                <Text
                                  style={[
                                    styles.timePickerLabel,
                                    { color: subtextColor },
                                  ]}
                                >
                                  Čas večerního souhrnu:
                                </Text>
                                {Platform.OS === 'ios' ? (
                                  <DateTimePicker
                                    value={parseTimeStringToDate(smartEveningTime)}
                                    mode="time"
                                    is24Hour
                                    display="compact"
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(_event, date) => {
                                      if (date) {
                                        setSmartEveningTime(
                                          formatDateToTimeString(date)
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <>
                                    <TouchableOpacity
                                      style={[
                                        styles.timePickerButton,
                                        {
                                          borderColor,
                                          backgroundColor: isDark
                                            ? '#262626'
                                            : '#FFFFFF',
                                        },
                                      ]}
                                      onPress={() => setShowEveningPicker(true)}
                                      activeOpacity={0.7}
                                    >
                                      <Ionicons
                                        name="time-outline"
                                        size={16}
                                        color={primaryColor}
                                        style={{ marginRight: 6 }}
                                      />
                                      <Text
                                        style={[
                                          styles.timePickerButtonText,
                                          { color: textColor },
                                        ]}
                                      >
                                        {smartEveningTime}
                                      </Text>
                                    </TouchableOpacity>

                                    {showEveningPicker && (
                                      <DateTimePicker
                                        value={parseTimeStringToDate(
                                          smartEveningTime
                                        )}
                                        mode="time"
                                        is24Hour
                                        display="default"
                                        onChange={(event, date) => {
                                          setShowEveningPicker(false);
                                          if (event.type === 'set' && date) {
                                            setSmartEveningTime(
                                              formatDateToTimeString(date)
                                            );
                                          }
                                        }}
                                      />
                                    )}
                                  </>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        {
                          backgroundColor: primaryColor,
                          opacity: isSaving ? 0.7 : 1,
                        },
                      ]}
                      onPress={handleSavePreferences}
                      disabled={isSaving}
                      activeOpacity={0.8}
                    >
                      {isSaving ? (
                        <>
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                            style={styles.saveLoadingIndicator}
                          />
                          <Text style={styles.saveButtonText}>
                            Ukládání předvoleb...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color="#FFFFFF"
                            style={styles.saveIcon}
                          />
                          <Text style={styles.saveButtonText}>
                            Uložit předvolby
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View
                    style={[
                      styles.disabledInfoCard,
                      { backgroundColor: cardBg, borderColor },
                    ]}
                  >
                    <Ionicons
                      name="notifications-off-outline"
                      size={36}
                      color={subtextColor}
                      style={{ marginBottom: 10 }}
                    />
                    <Text style={[styles.disabledInfoTitle, { color: textColor }]}>
                      Push notifikace jsou vypnuté
                    </Text>
                    <Text
                      style={[
                        styles.disabledInfoDescription,
                        { color: subtextColor },
                      ]}
                    >
                      Zapněte volbu „Povolit push notifikace“ výše pro nastavení
                      způsobu doručování a časů souhrnů.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // iOS Unavailable Placeholder
              <View
                style={[
                  styles.disabledInfoCard,
                  { backgroundColor: cardBg, borderColor },
                ]}
              >
                <Ionicons
                  name="logo-android"
                  size={36}
                  color={primaryColor}
                  style={{ marginBottom: 10 }}
                />
                <Text style={[styles.disabledInfoTitle, { color: textColor }]}>
                  Dostupné pouze pro Android
                </Text>
                <Text
                  style={[
                    styles.disabledInfoDescription,
                    { color: subtextColor },
                  ]}
                >
                  Upozornění na změny rozvrhu (BETA) jsou aktuálně podporována
                  pouze na zařízeních se systémem Android. Podpora pro iOS se 
                  momentálně připravuje.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* SUBSECTION 2: KLASIFIKACE A ZNÁMKY (MÍSTNÍ KONTROLA NA POZADÍ) */}
        {activeTab === 'grades' && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="school-outline"
                size={22}
                color={primaryColor}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.mainSectionHeader, { color: textColor }]}>
                Klasifikace a známky
              </Text>
            </View>

            {/* Android Battery Optimization Card */}
            {Platform.OS === 'android' && (
              <View
                style={[styles.card, { backgroundColor: cardBg, borderColor }]}
              >
                <View style={styles.bannerHeader}>
                  <Ionicons
                    name="battery-half-outline"
                    size={22}
                    color={primaryColor}
                  />
                  <Text
                    style={[
                      styles.bannerTitle,
                      { color: textColor, marginLeft: 8 },
                    ]}
                  >
                    Spolehlivost notifikací na pozadí
                  </Text>
                </View>

                <Text
                  style={[
                    styles.description,
                    { color: subtextColor, marginBottom: 14, marginTop: 6 },
                  ]}
                >
                  Android často ukončuje aplikace na pozadí, pokud je ze seznamu
                  spuštěných aplikací odstraníte (tzv. &quot;swipe away&quot;).
                  Aby kontrola známek fungovala spolehlivě i v těchto případech,
                  doporučujeme v nastavení telefonu povolit aplikaci „Neomezené“
                  využití baterie.
                </Text>

                <TouchableOpacity
                  style={[styles.outlinedButton, { borderColor: primaryColor }]}
                  onPress={openBatterySettings}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="cog-outline"
                    size={18}
                    color={primaryColor}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[styles.outlinedButtonText, { color: primaryColor }]}
                  >
                    Nastavení baterie pro aplikaci
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Grade Notifications Background Task Card */}
            <View
              style={[styles.card, { backgroundColor: cardBg, borderColor }]}
            >
              <View style={styles.mainToggleRow}>
                <View style={styles.mainToggleTextContainer}>
                  <Text style={[styles.mainToggleTitle, { color: textColor }]}>
                    Nové známky
                  </Text>
                  <Text
                    style={[styles.mainToggleSubtitle, { color: subtextColor }]}
                  >
                    Pravidelně na pozadí kontroluje nové známky a změny v
                    klasifikaci.
                  </Text>
                </View>

                {gradeBackgroundTask.isLoading ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : (
                  <Switch
                    value={gradeBackgroundTask.isRegistered}
                    onValueChange={gradeBackgroundTask.toggleTask}
                    disabled={gradeBackgroundTask.isLoading}
                    trackColor={{
                      false: isDark ? '#3E3E3E' : '#D1D1D6',
                      true: primaryColor,
                    }}
                    thumbColor={
                      Platform.OS === 'ios'
                        ? '#FFFFFF'
                        : gradeBackgroundTask.isRegistered
                          ? '#FFFFFF'
                          : '#F4F3F4'
                    }
                  />
                )}
              </View>

              {/* Action Buttons & Status (Visible when background check is enabled) */}
              {gradeBackgroundTask.isRegistered && (
                <View
                  style={[
                    styles.actionsContainer,
                    { borderTopColor: borderColor },
                  ]}
                >
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          borderColor,
                          backgroundColor: isDark ? '#262626' : '#F5F5F5',
                        },
                      ]}
                      onPress={() => testNotification()}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="notifications-outline"
                        size={16}
                        color={primaryColor}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[styles.actionButtonText, { color: textColor }]}
                      >
                        Otestovat notifikaci
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          borderColor,
                          backgroundColor: isDark ? '#262626' : '#F5F5F5',
                        },
                      ]}
                      onPress={() => checkGradesDefaultFetch()}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={16}
                        color={primaryColor}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[styles.actionButtonText, { color: textColor }]}
                      >
                        Zkontrolovat známky nyní
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[styles.lastCheckedText, { color: subtextColor }]}
                  >
                    Naposledy zkontrolováno:{' '}
                    {gradeLastCheckedTimestamp?.toLocaleString('cs-CZ') || '-'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  debugHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerContainer: {
    marginBottom: 16,
  },
  alertBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSubtext: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  mainSectionHeader: {
    fontSize: 18,
    fontWeight: '700',
  },
  betaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  betaBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  userBadgeIconContainer: {
    marginRight: 12,
  },
  userBadgeTextContainer: {
    flex: 1,
  },
  userBadgeTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  userBadgeSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  mainToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainToggleTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  mainToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  mainToggleSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  modesContainer: {
    gap: 12,
  },
  modeCard: {
    padding: 14,
    borderRadius: 12,
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeCardTitle: {
    fontSize: 15,
  },
  modeCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 28,
  },
  smartSection: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  smartSectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  smartSectionSubheader: {
    fontSize: 13,
    marginBottom: 12,
  },
  smartToggleContainer: {
    paddingVertical: 4,
  },
  smartToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  smartToggleIcon: {
    marginRight: 10,
  },
  smartToggleText: {
    flex: 1,
    paddingRight: 12,
  },
  smartToggleTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  smartToggleDescription: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 30,
    paddingTop: 6,
    paddingBottom: 4,
  },
  timePickerLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  timePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  innerDivider: {
    height: 1,
    marginVertical: 6,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 6,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveLoadingIndicator: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledInfoCard: {
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  disabledInfoDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  outlinedButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  lastCheckedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
