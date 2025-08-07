import { LockerData } from '@/api/SpseJecnaClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

export function LockerCard({ lockerData }: { lockerData: LockerData | null }) {
  const theme = useTheme();

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={2}
    >
      <Card.Content>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="locker"
            size={24}
            color={theme.colors.onSurface}
          />
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Skříňka
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text
              variant="headlineMedium"
              style={[styles.statValue, { color: theme.colors.primary }]}
            >
              {lockerData?.number}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Číslo
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text
              variant="headlineMedium"
              style={[styles.statValue, { fontSize: 15 }]}
            >
              {lockerData?.location}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant, marginTop: 0 },
              ]}
            >
              Umístění
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text
              variant="headlineMedium"
              style={[styles.statValue, { fontSize: 15 }]}
            >
              {lockerData?.period}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant, marginTop: 0 },
              ]}
            >
              Období
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
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 28,
    textAlign: 'center',
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
