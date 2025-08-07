import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Card, Switch, Text, useTheme, Button } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';

const STORAGE_KEY = 'hide-profilepicture';

export default function AdvancedSettings() {
  const theme = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const savedValue = await SecureStore.getItemAsync(STORAGE_KEY);
        if (savedValue !== null) {
          setEnabled(savedValue === 'true');
        }
      } catch (e) {
        console.error('Failed to load hide-profilepicture:', e);
      }
    })();
  }, []);

  const handleToggle = (value: boolean) => {
    if (value !== enabled) {
      setPendingEnabled(value);
    } else {
      // If toggled back to original, clear pending change
      setPendingEnabled(null);
    }
  };

  const handleRestart = async () => {
    if (pendingEnabled !== null) {
      try {
        await SecureStore.setItemAsync(
          STORAGE_KEY,
          pendingEnabled ? 'true' : 'false'
        );
        await Updates.reloadAsync(); // Restart the app to apply changes
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
          <View style={styles.switchRow}>
            <View style={{ flexShrink: 1, paddingRight: 8 }}>
              <Text
                variant="titleLarge"
                style={[styles.title, { color: theme.colors.onSurface }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                Schovat profilovku
              </Text>

              <Text
                variant="bodyMedium"
                style={[
                  styles.description,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Pro lidi, kteří se stydí za svoji profilovku na SPŠE Ječná
                stránce. Nyní se nikde na webu nebude zobrazovat váš profilový
                obrázek.
              </Text>
            </View>

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
    marginBottom: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    lineHeight: 22,
  },
  restartContainer: {
    marginTop: 12,
  },
});
