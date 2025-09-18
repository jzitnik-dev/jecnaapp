import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import {
  Card,
  Switch,
  Text,
  useTheme,
  Button,
  RadioButton,
} from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

// --- TYPES ---
type SwitchSetting = {
  type: 'switch';
  key: string;
  title: string;
  description: string;
  defaultValue: boolean;
};

type RadioSetting<T extends string = string> = {
  type: 'radio';
  key: string;
  title: string;
  description: string;
  options: { label: string; value: T }[];
  defaultValue: T;
};

type SettingItem = SwitchSetting | RadioSetting;

type SettingsState = Record<string, any>;

// --- UTILS ---
const loadSetting = async <T,>(key: string, defaultValue: T): Promise<T> => {
  const value = await SecureStore.getItemAsync(key);
  if (value === null) return defaultValue;
  // Boolean parsing for switches
  if (value === 'true') return true as unknown as T;
  if (value === 'false') return false as unknown as T;
  return value as unknown as T;
};

const saveSetting = async (key: string, value: any) => {
  await SecureStore.setItemAsync(key, value.toString());
};

// --- SETTING CARD ---
interface SettingCardProps<T = any> {
  setting: SettingItem;
  value: T;
  pending: boolean;
  pendingData: SettingsState;
  onChange: (val: T) => void;
}

const SettingCard = <T,>({
  setting,
  pendingData,
  value,
  pending,
  onChange,
}: SettingCardProps<T>) => {
  const theme = useTheme();

  const handleRestart = async () => {
    try {
      for (const key of Object.keys(pendingData)) {
        if (pendingData[key] !== undefined) {
          await saveSetting(key, pendingData[key]);
        }
      }
      await Updates.reloadAsync();
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se restartovat aplikaci.');
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.row}>
          <View style={{ flexShrink: 1, paddingRight: 8 }}>
            <Text
              variant="titleLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {setting.title}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.description,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {setting.description}
            </Text>
          </View>

          {setting.type === 'switch' && (
            <Switch
              value={value as boolean}
              onValueChange={val => onChange(val as T)}
            />
          )}
        </View>

        {setting.type === 'radio' && (
          <RadioButton.Group
            onValueChange={val => onChange(val as T)}
            value={value as string}
          >
            {setting.options.map(opt => (
              <View key={opt.value} style={styles.radioRow}>
                <RadioButton value={opt.value} />
                <Text style={{ color: theme.colors.onSurface }}>
                  {opt.label}
                </Text>
              </View>
            ))}
          </RadioButton.Group>
        )}

        {pending && (
          <>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.primary,
                marginTop: 12,
                fontWeight: '600',
              }}
            >
              Pro použití změny je třeba restartovat aplikaci.
            </Text>

            <View style={styles.restartButton}>
              <Button
                mode="contained"
                onPress={handleRestart}
                buttonColor={theme.colors.primary}
              >
                Restartovat aplikaci
              </Button>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

// --- SETTINGS CONFIG ---
const SETTINGS: SettingItem[] = [
  {
    type: 'switch',
    key: 'hide-profilepicture',
    title: 'Schovat profilovku',
    description:
      'Pro lidi, kteří se stydí za svoji profilovku na SPŠE Ječná stránce. Nyní se nikde v aplikaci nebude zobrazovat váš profilový obrázek.',
    defaultValue: false,
  },
  {
    type: 'radio',
    key: 'fast-load',
    title: 'Rychlost načítání',
    description:
      'Upravte rychlost načítání aplikace. U super rychlého může flashnout nenačtené téma. Tato funkce je experimentální a můžou se vyskytnout chyby.',
    options: [
      { label: 'Vypnuté', value: 'off' },
      { label: 'Střední', value: 'normal' },
      { label: 'Super rychlé', value: 'super' },
    ],
    defaultValue: 'off',
  },
  {
    type: 'switch',
    key: 'show-current-hour',
    title: 'Zobrazit aktuální hodinu',
    description: 'Aktuálně probíhající hodina změni bakground v rozvrhu hodin.',
    defaultValue: true,
  },
];

// --- MAIN COMPONENT ---
export default function AdvancedSettings() {
  const theme = useTheme();
  const [state, setState] = useState<SettingsState>({});
  const [pending, setPending] = useState<SettingsState>({});

  // Load all settings
  useEffect(() => {
    (async () => {
      const loaded: SettingsState = {};
      for (const s of SETTINGS) {
        loaded[s.key] = await loadSetting(s.key, s.defaultValue);
      }
      setState(loaded);
    })();
  }, []);

  const handleChange = (key: string, value: any) => {
    setPending(prev => ({
      ...prev,
      [key]: value !== state[key] ? value : undefined,
    }));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {SETTINGS.map(s => (
        <SettingCard
          key={s.key}
          setting={s}
          value={pending[s.key] !== undefined ? pending[s.key] : state[s.key]}
          pending={pending[s.key] !== undefined}
          onChange={val => handleChange(s.key, val)}
          pendingData={pending}
        />
      ))}
    </ScrollView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 16, elevation: 2, borderRadius: 12 },
  title: { fontWeight: '700', marginBottom: 2 },
  description: { lineHeight: 22 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  restartButton: { marginTop: 12 },
});
