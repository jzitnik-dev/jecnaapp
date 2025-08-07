import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

export default function AboutScreen() {
  const theme = useTheme();

  const handleEmailPress = () => {
    Linking.openURL('mailto:email@jzitnik.dev');
  };

  const handleGitHubPress = () => {
    Linking.openURL('https://github.com/jzitnik-dev/JecnaApp');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text
            variant="headlineMedium"
            style={[styles.appName, { color: theme.colors.onSurface }]}
          >
            Ječná App
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.version, { color: theme.colors.onSurfaceVariant }]}
          >
            Verze {Constants.expoConfig?.version || '1.0.0'}
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Neoficiální mobilní aplikace pro SPŠE Ječná. Poskytuje přístup k
            rozvrhu, známkám, učitelům a dalším školním informacím.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Funkce
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.featureList,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            • Rozvrh hodin{'\n'}• Známky a průměry{'\n'}• Seznam učitelů{'\n'}•
            Seznam učeben{'\n'}• Příchody a odchody{'\n'}• Omluvný list{'\n'}•
            Jídelníček{'\n'}• Notifikace nových známek
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Kontakt
          </Text>

          <Button
            mode="outlined"
            onPress={handleEmailPress}
            icon="email-outline"
            style={styles.contactButton}
          >
            email@jzitnik.dev
          </Button>

          <Button
            mode="outlined"
            onPress={handleGitHubPress}
            icon="github"
            style={styles.contactButton}
          >
            GitHub
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            O aplikaci
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}
          >
            Tato aplikace je neoficiální a není spojena se SPŠE Ječná. Vytvořena
            pro usnadnění přístupu ke školním informacím z mobilního zařízení.
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.infoText,
              { color: theme.colors.onSurfaceVariant, marginTop: 8 },
            ]}
          >
            Made with{' '}
            <MaterialCommunityIcons
              name="heart"
              size={14}
              color={theme.colors.error}
            />{' '}
            by{' '}
            <Text
              style={{
                color: theme.colors.primary,
                textDecorationLine: 'underline',
              }}
              onPress={() => Linking.openURL('https://jzitnik.dev')}
            >
              Jakub Žitník
            </Text>
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
  appName: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  version: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featureList: {
    lineHeight: 20,
  },
  contactButton: {
    marginBottom: 8,
  },
  infoText: {
    lineHeight: 20,
  },
});
