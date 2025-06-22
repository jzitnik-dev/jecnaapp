import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useAbsenceStats } from '../../hooks/useAbsenceStats';

export function AbsenceCard() {
  const theme = useTheme();
  const { totalExcused, totalUnexcused, totalAbsences, loading, error } = useAbsenceStats();

  if (loading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
            📋 Omluvené hodiny
          </Text>
          <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Načítání...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
            📋 Omluvené hodiny
          </Text>
          <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
          📋 Omluvené hodiny
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.primary }]}>
              {totalExcused}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Omluvené
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.error }]}>
              {totalUnexcused}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Neomluvené
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.secondary }]}>
              {totalAbsences}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Celkem
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
  },
}); 