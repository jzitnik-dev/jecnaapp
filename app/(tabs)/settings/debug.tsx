import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSecureStore } from '@/hooks/useSecureStore';
import { CUSTOM_TIME_OFFSET_KEY } from '@/utils/dashboard/manualDateTime';

function mergeDateAndTime(base: Date, picked: Date): Date {
  const merged = new Date(base);
  merged.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return merged;
}

function mergeTime(base: Date, picked: Date): Date {
  const merged = new Date(base);
  merged.setHours(picked.getHours(), picked.getMinutes());
  return merged;
}

export default function DebugScreen() {
  const theme = useTheme();

  const [offsetMs, setOffsetMs] = useSecureStore<number>(
    CUSTOM_TIME_OFFSET_KEY,
    {
      initialValue: 0,
      parse: val => Number(val) || 0,
      stringify: val => String(val),
    }
  );

  const enabled = offsetMs !== 0;

  const [pending, setPending] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const pickerOpen = showDatePicker || showTimePicker;

  useEffect(() => {
    if (pickerOpen) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [pickerOpen]);

  const simulatedNow = new Date(now.getTime() + offsetMs);
  const pendingTarget = pending ?? simulatedNow;

  const openDatePicker = () => {
    setPending(prev => prev ?? new Date(simulatedNow));
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setPending(prev => prev ?? new Date(simulatedNow));
    setShowTimePicker(true);
  };

  const closePickers = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setPending(prev => mergeDateAndTime(prev ?? simulatedNow, date));
    if (Platform.OS === 'android') setShowDatePicker(false);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setPending(prev => mergeTime(prev ?? simulatedNow, date));
    if (Platform.OS === 'android') setShowTimePicker(false);
  };

  const apply = () => {
    setOffsetMs(pendingTarget.getTime() - Date.now());
    setPending(null);
    closePickers();
  };

  const reset = () => {
    setOffsetMs(0);
    setPending(null);
    closePickers();
  };

  const fmtDateTime = (d: Date) =>
    `${d.toLocaleDateString('cs-CZ')} ${d.toLocaleTimeString('cs-CZ')}`;

  const fmtDate = (d: Date) => d.toLocaleDateString('cs-CZ');
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Vlastní datum a čas
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Simuluje jiné datum a čas pro rozvrh a widgety. Od zvoleného
            okamžiku čas běží dál vpřed.
          </Text>

          <View style={styles.statusRow}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Skutečný čas
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {fmtDateTime(now)}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Simulovaný čas
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                fontWeight: '700',
                color: enabled
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
              }}
            >
              {fmtDateTime(simulatedNow)}
            </Text>
          </View>

          <View style={styles.pickerRow}>
            <Button
              mode="outlined"
              icon="calendar"
              style={styles.pickerButton}
              onPress={openDatePicker}
            >
              {fmtDate(pendingTarget)}
            </Button>
            <Button
              mode="outlined"
              icon="clock-outline"
              style={styles.pickerButton}
              onPress={openTimePicker}
            >
              {fmtTime(pendingTarget)}
            </Button>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={pendingTarget}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={pendingTarget}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
          {pickerOpen && Platform.OS === 'ios' && (
            <Button
              mode="text"
              onPress={closePickers}
              style={styles.doneButton}
            >
              Hotovo
            </Button>
          )}

          <Button
            mode="contained"
            icon="content-save"
            style={styles.applyButton}
            onPress={apply}
          >
            Použít tento čas
          </Button>
          <Button
            mode="outlined"
            icon="restore"
            disabled={!enabled}
            onPress={reset}
          >
            Obnovit skutečný čas
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 16, elevation: 2, borderRadius: 12 },
  title: { fontWeight: '700', marginBottom: 16 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  pickerButton: { flex: 1, marginHorizontal: 4 },
  doneButton: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 8 },
  applyButton: { marginTop: 8, marginBottom: 12 },
  warning: { marginBottom: 16, fontWeight: '600' },
});
