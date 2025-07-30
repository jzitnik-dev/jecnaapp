import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import {
  Card,
  Switch,
  Text,
  useTheme,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

const STORAGE_KEY = 'extraordinary_schedule_enabled';
const STATUS_URL = 'https://jecnarozvrh.jzitnik.dev/status';

export default function ExtraordinarySchedule() {
  const theme = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<{
    working: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const savedValue = await SecureStore.getItemAsync(STORAGE_KEY);
        const parsed = savedValue === 'true';
        setEnabled(parsed);
      } catch {
        // Ignorovat chyby
      }
    })();
  }, []);

  // Status serveru
  useEffect(() => {
    let isActive = true;

    const fetchStatus = async () => {
      setLoadingStatus(true);
      try {
        const response = await fetch(STATUS_URL);
        if (!response.ok) throw new Error('Síťová odpověď nebyla v pořádku');
        const json = await response.json();
        if (isActive) setServiceStatus(json);
      } catch (e: any) {
        if (isActive) {
          setServiceStatus({
            working: false,
            message: e.message || 'Nepodařilo se získat stav',
          });
        }
      } finally {
        if (isActive) setLoadingStatus(false);
      }
    };

    fetchStatus();

    return () => {
      isActive = false;
    };
  }, []);

  const handleToggle = (value: boolean) => {
    if (value !== enabled) {
      setPendingEnabled(value);
    }
  };

  const handleRestart = async () => {
    if (pendingEnabled !== null) {
      try {
        await SecureStore.setItemAsync(
          STORAGE_KEY,
          pendingEnabled ? 'true' : 'false'
        );
        await Updates.reloadAsync(); // Restartuje aplikaci
      } catch {
        Alert.alert('Chyba', 'Nepodařilo se restartovat aplikaci.');
      }
    }
  };

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
            Mimořádný rozvrh
          </Text>

          <View style={styles.switchRow}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Zapnout funkci
            </Text>
            <Switch
              value={pendingEnabled !== null ? pendingEnabled : enabled}
              onValueChange={handleToggle}
            />
          </View>

          {pendingEnabled !== null && pendingEnabled !== enabled && (
            <View style={styles.restartContainer}>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.primary,
                  marginBottom: 8,
                  fontWeight: '600',
                }}
              >
                Pro použití změny je třeba restartovat aplikaci.
              </Text>
              <Button
                mode="contained"
                onPress={handleRestart}
                buttonColor={theme.colors.primary}
              >
                Restartovat aplikaci
              </Button>
            </View>
          )}

          <Text
            variant="bodyMedium"
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Mimořádný rozvrh přímo ve stálém rozvrhu. Mimořádný rozvrh je přímo
            scrapovaný z online tabulky.&nbsp;
            <Text
              style={[
                styles.description,
                { color: theme.colors.onSurfaceVariant, fontWeight: '900' },
              ]}
            >
              Tabulka je scrapovaná na mém serveru, který běžím doma v malé
              vesnici u Ostravy, tak prosím nečekejte 100% uptime. Taky
              scrapovat Microsoft OneDrive tabulku není nejvíc stable věc.
            </Text>
          </Text>

          <Text
            variant="bodySmall"
            style={[styles.warningText, { color: theme.colors.error }]}
          >
            Tato funkce je experimentální a může být nestabilní. Tato funkce
            využívá data z mého serveru, backend tohoto serveru není opensource!
            Neručím za správnost dat.
          </Text>

          <Text
            variant="titleMedium"
            style={[styles.statusTitle, { color: theme.colors.onSurface }]}
          >
            Stav mého serveru
          </Text>

          {loadingStatus ? (
            <ActivityIndicator animating={true} color={theme.colors.primary} />
          ) : (
            <Text
              variant="bodyMedium"
              style={{
                color: serviceStatus?.working
                  ? theme.colors.primary
                  : theme.colors.error,
                fontWeight: '600',
              }}
            >
              {serviceStatus?.working
                ? 'Služba aktivní'
                : `Služba neaktivní${serviceStatus?.message ? `: ${serviceStatus.message}` : ''}`}
            </Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningText: {
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    lineHeight: 22,
    marginBottom: 24,
  },
  statusTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  restartContainer: {
    marginBottom: 20,
  },
});
