import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Divider, Menu, Surface, Text, useTheme } from 'react-native-paper';
import type { Timetable } from '../../api/SpseJecnaClient';
import { useSpseJecnaClient } from '../../hooks/useSpseJecnaClient';

export default function RozvrhScreen() {
  const { client } = useSpseJecnaClient();
  const theme = useTheme();
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);
  const { data, error, isLoading, refetch, isFetching } = useQuery<Timetable>({
    queryKey: ['timetable', selectedYear, selectedPeriod],
    queryFn: async () => {
      if (!client) throw new Error('Not logged in');
      return client.getTimetable(selectedYear, selectedPeriod);
    },
    enabled: !!client,
  });
  // Handle selects
  const meta = data?.meta;
  React.useEffect(() => {
    if (meta) {
      if (!selectedYear || !meta.years.some(y => y.id === selectedYear)) {
        setSelectedYear(meta.selectedYearId);
      }
      if (!selectedPeriod || !meta.periods.some(p => p.id === selectedPeriod)) {
        setSelectedPeriod(meta.selectedPeriodId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  if (!client) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginTop: 24 }}>Přihlaste se prosím.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={{ marginTop: 16 }}>Načítám rozvrh…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', marginTop: 24 }}>{String(error)}</Text>
        <Button mode="contained" onPress={() => { setSelectedYear(undefined); setSelectedPeriod(undefined); refetch(); }} style={{ marginTop: 16 }}>Resetovat výběr</Button>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginTop: 24 }}>Rozvrh nebyl nalezen.</Text>
      </View>
    );
  }

  // Responsive cell width
  const screenWidth = Dimensions.get('window').width;
  const periodCount = data.periods.length;
  const cellWidth = Math.max(120, Math.floor((screenWidth - 24) / (periodCount + 1)));
  const cellHeight = 90; // fixed height for each cell

  // Colors for dark/light mode
  const isDark = theme.dark;
  const tableBg = theme.colors.surface;
  const cellBg = isDark ? '#23272e' : '#fff';
  const headerBg = isDark ? '#181a20' : '#f3f4fa';
  const textColor = theme.colors.onSurface;
  const borderColor = theme.colors.outline;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 56 }} contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingTop: 12, alignItems: 'center', zIndex: 10 }}>
        {/* Year select */}
        <Menu
          visible={yearMenuVisible}
          onDismiss={() => setYearMenuVisible(false)}
          anchor={<Button mode="outlined" onPress={() => setYearMenuVisible(true)}>{meta?.years.find(y => y.id === selectedYear)?.label || 'Rok'}</Button>}
        >
          {meta?.years.map(y => (
            <Menu.Item key={y.id} onPress={() => { setSelectedYear(y.id); setYearMenuVisible(false); }} title={y.label} />
          ))}
        </Menu>
        {/* Period select */}
        <Menu
          visible={periodMenuVisible}
          onDismiss={() => setPeriodMenuVisible(false)}
          anchor={<Button mode="outlined" onPress={() => setPeriodMenuVisible(true)}>{meta?.periods.find(p => p.id === selectedPeriod)?.label || 'Období'}</Button>}
        >
          {meta?.periods.map(p => (
            <Menu.Item key={p.id} onPress={() => { setSelectedPeriod(p.id); setPeriodMenuVisible(false); }} title={p.label} />
          ))}
        </Menu>
        {(isFetching || isLoading) && <ActivityIndicator size={18} style={{ marginLeft: 8 }} />}
      </ScrollView>
      <ScrollView horizontal style={{ flex: 1 }} contentContainerStyle={{ minWidth: screenWidth }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          <Surface style={[styles.table, { backgroundColor: tableBg, borderRadius: 18, borderColor }]} elevation={3}>
            {/* Header row */}
            <View style={[styles.row, styles.stickyHeader, Platform.OS === 'web' ? { position: 'sticky', top: 0, zIndex: 10 } : {}]}>
              <View style={[styles.headerCell, { width: cellWidth, backgroundColor: headerBg, borderTopLeftRadius: 18, borderColor, borderRightWidth: 1 }]}>
                <Text style={[styles.headerText, { color: textColor }]}> </Text>
              </View>
              {data.periods.map((period, idx) => (
                <View key={idx} style={[
                  styles.headerCell,
                  {
                    width: cellWidth,
                    backgroundColor: headerBg,
                    borderTopRightRadius: idx === data.periods.length - 1 ? 18 : 0,
                    borderColor,
                    borderRightWidth: idx === data.periods.length - 1 ? 0 : 1,
                  }
                ]}>
                  <Text style={[styles.headerText, { color: textColor }]}>{period.number}</Text>
                  <Text style={[styles.timeText, { color: isDark ? '#aaa' : '#888' }]}>{period.time}</Text>
                </View>
              ))}
            </View>
            <Divider style={{ height: 1, backgroundColor: borderColor }} />
            {/* Day rows */}
            {data.days.map((day, dayIdx) => (
              <View key={day.day + dayIdx} style={styles.row}>
                <View style={[styles.dayCell, { width: cellWidth, backgroundColor: headerBg, borderBottomLeftRadius: dayIdx === data.days.length - 1 ? 18 : 0, borderColor }]}>
                  <Text style={[styles.dayText, { color: textColor }]}>{day.day}</Text>
                </View>
                {day.cells.map((cell, periodIdx) => {
                  const isSplit = cell && cell.length > 1;
                  return (
                    <View
                      key={periodIdx}
                      style={[
                        styles.cell,
                        {
                          width: cellWidth,
                          height: cellHeight,
                          backgroundColor: cellBg,
                          borderBottomRightRadius:
                            dayIdx === data.days.length - 1 && periodIdx === day.cells.length - 1 ? 18 : 0,
                          borderColor,
                          borderRightWidth: periodIdx === day.cells.length - 1 ? 0 : 1,
                        },
                      ]}
                    >
                      {cell && cell.length > 0 ? cell.map((lesson, i) => (
                        <View
                          key={i}
                          style={[
                            styles.lessonSquare,
                            {
                              backgroundColor: isDark ? '#23272e' : '#f3f4fa',
                              borderColor: isDark ? '#333' : '#ddd',
                              borderBottomWidth: isSplit && i === 0 ? 1 : 0,
                              borderRightWidth: 0,
                              borderLeftWidth: 0,
                              borderTopWidth: 0,
                              height: isSplit ? cellHeight / 2 : cellHeight,
                              width: '100%',
                              flex: 1,
                              margin: 0,
                              padding: 6,
                              borderRadius: 0,
                              justifyContent: 'flex-start',
                              alignItems: 'stretch',
                            },
                          ]}
                        >
                          <View style={{ position: 'absolute', top: 6, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={[styles.teacherSquare, {
                              color: isDark ? '#90caf9' : '#4a6fa5',
                              fontSize: 12,
                              flex: 1,
                              marginRight: 4
                            }]} numberOfLines={1} ellipsizeMode="tail">{lesson.teacher}</Text>
                            {lesson.room ? (
                              <View style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}>
                                <Text style={[styles.roomSquare, {
                                  color: isDark ? '#bbb' : '#888',
                                  fontSize: 11,
                                  fontWeight: '500'
                                }]} numberOfLines={1}>{lesson.room}</Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={[styles.subjectSquare, {
                              color: textColor,
                              fontSize: 15,
                              fontWeight: '600',
                              textAlign: 'center'
                            }]} numberOfLines={1} ellipsizeMode="tail">{lesson.subject}</Text>
                            {lesson.group ? (
                              <Text style={[styles.groupSquare, {
                                color: isDark ? '#aaa' : '#666',
                                fontSize: 11,
                                marginTop: 2,
                                textAlign: 'center'
                              }]} numberOfLines={1} ellipsizeMode="tail">{lesson.group}</Text>
                            ) : null}
                          </View>
                        </View>
                      )) : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </Surface>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scrollContent: {
    padding: 12,
    alignItems: 'stretch',
  },
  table: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stickyHeader: {
    ...Platform.select({
      web: { position: 'sticky', top: 0, zIndex: 10 },
      default: {},
    }),
  },
  headerCell: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderTopWidth: 0,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayCell: {
    padding: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  cell: {
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    minHeight: 0,
    backgroundColor: 'transparent',
  },
  lessonSquare: {
    borderColor: '#333',
    borderRadius: 0,
    margin: 0,
    paddingLeft: 10,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'stretch',
    minHeight: 0,
    minWidth: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    width: '100%',
  },
  teacherSquare: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 0,
    textAlign: 'left',
    width: '100%',
  },
  subjectSquare: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 0,
    textAlign: 'left',
    width: '100%',
  },
  roomSquare: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
    textAlign: 'right',
    width: '100%',
  },
  groupSquare: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
    width: '100%',
  },
});