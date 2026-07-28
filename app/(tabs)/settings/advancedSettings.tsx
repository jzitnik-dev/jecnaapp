import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Card, Switch, Text, useTheme, RadioButton } from 'react-native-paper';

import { useSecureStore } from '@/hooks/useSecureStore';

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
    type: 'switch',
    key: 'show-current-hour',
    title: 'Zobrazit aktuální hodinu',
    description: 'Aktuálně probíhající hodina změní backgrond v rozvrhu hodin.',
    defaultValue: true,
  },
];

const SettingCard = ({ setting }: { setting: SettingItem }) => {
  const theme = useTheme();
  const isSwitch = setting.type === 'switch';

  const [value, setValue, isLoading] = useSecureStore<any>(setting.key, {
    initialValue: setting.defaultValue,
    parse: isSwitch ? val => val === 'true' : val => val,
    stringify: isSwitch ? val => (val ? 'true' : 'false') : val => String(val),
  });

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.row}>
          <View style={{ flexShrink: 1, paddingRight: 8 }}>
            <Text
              variant="titleLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
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

          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : setting.type === 'switch' ? (
            <Switch value={value as boolean} onValueChange={setValue} />
          ) : null}
        </View>

        {!isLoading && setting.type === 'radio' && (
          <RadioButton.Group onValueChange={setValue} value={value as string}>
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
      </Card.Content>
    </Card>
  );
};

export default function AdvancedSettings() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {SETTINGS.map(setting => (
        <SettingCard key={setting.key} setting={setting} />
      ))}
    </ScrollView>
  );
}

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
});
