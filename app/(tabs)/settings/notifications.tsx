import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Switch, Text, useTheme } from 'react-native-paper';
import { useGradeNotifications } from '../../../hooks/useGradeNotifications';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const {
    settings,
    isEnabled,
    isLoading,
    requestPermissions,
    startNotifications,
    stopNotifications,
    testNotification,
    checkForNewGrades,
  } = useGradeNotifications();

  const handleToggleNotifications = async () => {
    if (isEnabled) {
      await stopNotifications();
    } else {
      const granted = await requestPermissions();
      if (granted) {
        await startNotifications();
      }
    }
  };

  const getPermissionStatusText = () => {
    if (!settings) return 'Načítání...';
    
    switch (settings.permissions.status) {
      case 'granted':
        return 'Povoleno';
      case 'denied':
        return 'Zamítnuto';
      case 'undetermined':
        return 'Nepožádáno';
      default:
        return 'Neznámý stav';
    }
  };

  const getBackgroundFetchStatusText = () => {
    if (!settings) return 'Načítání...';
    
    switch (settings.backgroundTaskStatus) {
      case 'available':
        return 'Dostupné';
      case 'denied':
        return 'Zamítnuto';
      case 'restricted':
        return 'Omezeno';
      case null:
        return 'Nedostupné';
      default:
        return 'Neznámý stav';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
            Notifikace známek
          </Text>
          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            Získejte notifikace o nových známkách. Aplikace bude kontrolovat nové známky každou hodinu na pozadí.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Notifikace známek
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Zapnout/vypnout notifikace
              </Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isLoading}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Stav oprávnění
          </Text>
          
          <View style={styles.statusRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Notifikace:
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {getPermissionStatusText()}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Pozadí:
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {getBackgroundFetchStatusText()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Testování
          </Text>
          
          <Button
            mode="outlined"
            onPress={testNotification}
            disabled={isLoading}
            style={styles.button}
          >
            Odeslat testovací notifikaci
          </Button>
          
          <Button
            mode="outlined"
            onPress={checkForNewGrades}
            disabled={isLoading}
            style={styles.button}
          >
            Zkontrolovat nové známky
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Informace
          </Text>
          
          <Text variant="bodySmall" style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
            • Notifikace se kontrolují každou hodinu na pozadí{'\n'}
            • Aplikace musí být alespoň jednou spuštěna{'\n'}
            • Pro správnou funkčnost musíte být přihlášeni{'\n'}
            • Notifikace se zobrazí pouze pro nové známky{'\n'}
            • Data o předchozích známkách se ukládají lokálně
          </Text>
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
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  button: {
    marginBottom: 8,
  },
  infoText: {
    lineHeight: 20,
  },
});