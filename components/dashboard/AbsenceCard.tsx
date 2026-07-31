import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AbsencesPage } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

function parse(data: AbsencesPage | null) {
  let totalExcused = 0;
  let totalUnexcused = 0;
  let totalAbsences = 0;
  let totalLateArrivals = 0;

  if (data && data.absences) {
    for (const absence of Object.values(data.absences)) {
      totalAbsences += absence.hoursAbsent;
      if (absence.unexcusedHours > 0) {
        totalUnexcused += absence.unexcusedHours;
        totalExcused += absence.hoursAbsent - absence.unexcusedHours;
      } else {
        totalExcused += absence.hoursAbsent;
      }
      totalLateArrivals += absence.lateEntryCount;
    }
  }

  return {
    totalExcused,
    totalUnexcused,
    totalAbsences,
    totalLateArrivals,
  };
}

interface AbsenceCardProps {
  data: AbsencesPage | null | never[];
}

export function AbsenceCard({ data }: AbsenceCardProps) {
  const theme = useTheme();
  const isDark = theme.dark;

  const isLoading = !data || (Array.isArray(data) && data.length === 0);

  if (isLoading) {
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
            {[1, 2, 3].map(key => (
              <View key={key} style={styles.statItem}>
                <Skeleton
                  style={{ width: 40, height: 32, marginBottom: 4 }}
                  isDark={isDark}
                />
                <Skeleton style={{ width: 70, height: 14 }} isDark={isDark} />
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  }

  const { totalExcused, totalUnexcused, totalLateArrivals } = parse(
    data as AbsencesPage
  );

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
              {totalLateArrivals}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.statLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Pozdní příchody
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
    width: 90,
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
