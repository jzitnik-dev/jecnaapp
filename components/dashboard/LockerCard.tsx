import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Locker } from 'jecnaapi-react-native/jecnaapi';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

interface LockerCardProps {
  lockerData: Locker | null | never[];
}

export function LockerCard({ lockerData }: LockerCardProps) {
  const theme = useTheme();
  const isDark = theme.dark;

  const isLoading =
    !lockerData || (Array.isArray(lockerData) && lockerData.length === 0);

  if (isLoading) {
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
              style={{ marginRight: 8 }}
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
              <Skeleton
                style={{ width: 60, height: 32, marginBottom: 8 }}
                isDark={isDark}
              />
              <Skeleton
                style={{ width: 40, height: 14, marginBottom: 16 }}
                isDark={isDark}
              />
            </View>

            <View style={styles.statItem}>
              <Skeleton
                style={{ width: 140, height: 20, marginBottom: 6 }}
                isDark={isDark}
              />
              <Skeleton
                style={{ width: 60, height: 14, marginBottom: 16 }}
                isDark={isDark}
              />
            </View>

            <View style={styles.statItem}>
              <Skeleton
                style={{ width: 180, height: 20, marginBottom: 6 }}
                isDark={isDark}
              />
              <Skeleton style={{ width: 50, height: 14 }} isDark={isDark} />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const locker = lockerData as Locker;

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
            style={{ marginRight: 8 }}
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
              {locker.number}
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
              {locker.location}
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
              {locker.assignedFrom?.toLocaleDateString('cs-CZ')} -{' '}
              {locker.assignedUntil?.toLocaleDateString('cs-CZ') || '?'}
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
    marginBottom: 8,
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
