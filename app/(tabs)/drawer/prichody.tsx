import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import {
  getCurrentSchoolYearStart,
  MonthSelector,
  YearSelector,
} from '@/utils/selectors';
import { MONTH_NAMES, MonthName } from 'jecnaapi-react-native/jecnaapi';
import { formatTime } from '@/utils/dateUtils';
import { JecnaAPI } from 'jecnaapi-react-native';

export default function PrichodyScreen() {
  const theme = useTheme();

  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<MonthName | undefined>();

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['prichody', selectedYear, selectedMonth],
    queryFn: async () => {
      const date = new Date();
      let final:
        | { firstCalendarYear: number; month: MonthName }
        | { firstCalendarYear: undefined; month: undefined } = {
        firstCalendarYear: undefined,
        month: undefined,
      };

      if (selectedYear === undefined && selectedMonth !== undefined) {
        final = {
          firstCalendarYear: getCurrentSchoolYearStart(),
          month: selectedMonth,
        };
      } else if (selectedMonth === undefined && selectedYear !== undefined) {
        final = {
          firstCalendarYear: selectedYear,
          month: MONTH_NAMES[date.getMonth()],
        };
      } else if (selectedYear !== undefined && selectedMonth !== undefined) {
        final = {
          firstCalendarYear: selectedYear,
          month: selectedMonth,
        };
      }

      return await JecnaAPI.getAttendances(final);
    },
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });

  const daysArray = useMemo(() => {
    if (!data?.attendances) return [];
    return Object.entries(data.attendances).map(([date, events]) => ({
      date,
      events,
    }));
  }, [data]);

  console.log(error);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 16,
          paddingBottom: 0,
        }}
      >
        <YearSelector
          handleSelectYear={setSelectedYear}
          selected={selectedYear}
        />

        <MonthSelector
          handleSelectMonth={setSelectedMonth}
          selected={selectedMonth}
        />
      </View>

      {isFetching && !isLoading && (
        <View style={{ padding: 8, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16 }}>Načítám příchody…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: 'red' }}>Chyba při načítání příchodů.</Text>
          <Button onPress={() => refetch()}>Zkusit znovu</Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
          {daysArray.length === 0 ? (
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 32,
              }}
            >
              Žádné záznamy.
            </Text>
          ) : (
            daysArray.map((day, i) => {
              const formattedDate = new Date(day.date).toLocaleDateString(
                'cs-CZ'
              );

              return (
                <Surface
                  key={day.date}
                  style={[
                    styles.dayCard,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[styles.dayDate, { color: theme.colors.primary }]}
                  >
                    {formattedDate}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginTop: 6,
                    }}
                  >
                    {day.events.length === 0 ? (
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        Žádné záznamy
                      </Text>
                    ) : (
                      day.events.map((ev, j) => {
                        const isEnter = ev.type === 'ENTER';
                        const displayType = isEnter ? 'Příchod' : 'Odchod';

                        return (
                          <View
                            key={j}
                            style={[
                              styles.event,
                              {
                                backgroundColor: isEnter
                                  ? '#c8e6c9'
                                  : '#ffcdd2',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.eventType,
                                {
                                  color: isEnter ? '#388e3c' : '#b71c1c',
                                },
                              ]}
                            >
                              {displayType}
                            </Text>
                            <Text
                              style={[
                                styles.eventTime,
                                {
                                  color: isEnter ? '#388e3c' : '#b71c1c',
                                },
                              ]}
                            >
                              {formatTime(ev.time)}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                </Surface>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dayCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dayDate: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  event: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventType: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 15,
  },
  eventTime: {
    fontSize: 15,
    fontWeight: '500',
  },
});
