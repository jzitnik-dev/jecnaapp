import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { OmluvnyListResult } from '@/api/SpseJecnaClient';

function parse(data: OmluvnyListResult | null) {
  let totalExcused = 0;
  let totalUnexcused = 0;
  let totalAbsences = 0;

  if (data && data.absences) {
    for (const absence of data.absences) {
      totalAbsences += absence.count;
      if (absence.countUnexcused) {
        totalUnexcused += absence.countUnexcused;
        totalExcused += absence.count - absence.countUnexcused;
      } else {
        totalExcused += absence.count;
      }
    }
  }

  return {
    totalExcused,
    totalUnexcused,
    totalAbsences,
  };
}

export function AbsenceCard({ data }: { data: OmluvnyListResult | null }) {
  const theme = useTheme();
  const { totalExcused, totalUnexcused, totalAbsences } = parse(data);

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={2}
    >
      <Card.Content>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="clipboard-text"
            size={24}
            color={theme.colors.onSurface}
            style={{ marginRight: 8 }}
          />
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Omluvené hodiny
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text
              variant="headlineMedium"
              style={[styles.statValue, { color: theme.colors.primary }]}
            >
              {totalExcused}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Omluvené
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text
              variant="headlineMedium"
              style={[styles.statValue, { color: theme.colors.error }]}
            >
              {totalUnexcused}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Neomluvené
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text
              variant="headlineMedium"
              style={[styles.statValue, { color: theme.colors.secondary }]}
            >
              {totalAbsences}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
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
