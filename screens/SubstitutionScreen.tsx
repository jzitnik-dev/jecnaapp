import { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, useTheme, Button, Menu } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRouter, type Href } from 'expo-router';

import { useJecnaRozvrhClient } from '@/hooks/useJecnaRozvrhClient';
import { AnnouncementsSection } from '@/components/timetable/announcements';
import ExtraReport from '@/components/ExtraReport';
import { useLayoutPaths } from '@/lib/layoutPaths';
import {
  ApiResponse,
  ChangeEntry,
  AbsenceEntry,
} from '@jzitnik/jecna_supl_client_ts';
import { formatTime } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';

function formatCzechDate(dateString: string) {
  try {
    const [year, month, day] = dateString.split('-');
    return `${parseInt(day, 10)}.${parseInt(month, 10)}.${year}`;
  } catch {
    return dateString;
  }
}

function formatAndroidColor(hex?: string | null) {
  if (!hex) return undefined;

  const cleaned = hex.startsWith('#') ? hex : `#${hex}`;

  if (cleaned.length === 9) {
    const aa = cleaned.substring(1, 3);
    const rrggbb = cleaned.substring(3, 9);
    return `#${rrggbb}${aa}`;
  }

  return cleaned;
}

export default function SubstitutionsAllScreen() {
  const theme = useTheme();
  const router = useRouter();
  const paths = useLayoutPaths();
  const { client: extraordClient } = useJecnaRozvrhClient();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateMenuVisible, setDateMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const { data, error, refetch, isFetching } = useQuery<ApiResponse>({
    queryKey: ['all-substitutions'],
    queryFn: async () => {
      if (!extraordClient) throw new Error('Client not initialized');
      return await extraordClient.getAll();
    },
    enabled: !!extraordClient,
  });

  // Automatically select the first available date if none is selected
  useEffect(() => {
    if (data?.schedule && !selectedDate) {
      const dates = Object.keys(data.schedule).sort();
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    }
  }, [data, selectedDate]);

  const availableDates = useMemo(() => {
    if (!data?.schedule) return [];
    return Object.keys(data.schedule).sort();
  }, [data]);

  const selectedDayData = selectedDate ? data?.schedule[selectedDate] : null;
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexDirection: 'row',
          }}
        >
          <TouchableOpacity
            style={{
              borderRadius: 4,
              paddingVertical: 15,
              paddingHorizontal: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onPress={() => setReportModalVisible(true)}
          >
            <Ionicons
              name="alert-circle-outline"
              size={25}
              color={theme.colors.onSurface}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, theme]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ExtraReport
        modalVisible={reportModalVisible}
        setModalVisible={setReportModalVisible}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {/* Error State */}
        {error && (
          <View style={styles.centered}>
            <Text style={{ color: theme.colors.error }}>{String(error)}</Text>
          </View>
        )}

        {/* Success State */}
        {data && (
          <View style={styles.contentContainer}>
            {/* Last Updated Info */}
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Aktualizováno: {formatTime(data.status.lastUpdated)} (aktualizace
              každých{' '}
              {data.status.currentUpdateSchedule < 60
                ? `${data.status.currentUpdateSchedule} min`
                : `${Math.floor(data.status.currentUpdateSchedule / 60)} hod`}
              )
            </Text>

            {/* Date Selector Menu */}
            <View style={{ alignSelf: 'flex-start', marginVertical: 8 }}>
              <Menu
                visible={dateMenuVisible}
                onDismiss={() => setDateMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setDateMenuVisible(true)}
                    icon="calendar"
                  >
                    {selectedDate
                      ? `${formatCzechDate(selectedDate)}${
                          data.schedule[selectedDate]?.info.inWork
                            ? ' (příprava)'
                            : ''
                        }`
                      : 'Vyberte datum'}
                  </Button>
                }
              >
                {availableDates.map(date => (
                  <Menu.Item
                    key={date}
                    onPress={() => {
                      setSelectedDate(date);
                      setDateMenuVisible(false);
                    }}
                    title={`${formatCzechDate(date)}${
                      data.schedule[date]?.info.inWork ? ' (příprava)' : ''
                    }`}
                  />
                ))}
              </Menu>
            </View>

            {/* Announcements */}
            {selectedDate &&
              data.announcements[selectedDate] &&
              data.announcements[selectedDate].length > 0 && (
                <AnnouncementsSection
                  announcements={data.announcements[selectedDate]}
                  style={{ marginBottom: 16 }}
                />
              )}

            {/* Selected Day Content */}
            {selectedDayData && (
              <View style={{ gap: 16 }}>
                {/* Takes Place */}
                <Card style={{ backgroundColor: theme.colors.surfaceVariant }}>
                  <Card.Content>
                    <Text
                      variant="labelMedium"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginBottom: 4,
                      }}
                    >
                      Informace o dni
                    </Text>
                    <Text variant="bodyMedium">
                      {selectedDayData.takesPlace.trim() ||
                        'Dnes se nekonají žádné akce.'}
                    </Text>
                  </Card.Content>
                </Card>

                {/* Substitutions Table */}
                <Text variant="titleMedium" style={{ marginTop: 8 }}>
                  Změny v rozvrhu
                </Text>
                <SubstitutionsTable changes={selectedDayData.changes} />

                {/* Teacher Absences */}
                <Text variant="titleMedium" style={{ marginTop: 8 }}>
                  Chybějící učitelé
                </Text>
                {selectedDayData.absence.length > 0 ? (
                  <View style={{ gap: 8 }}>
                    {selectedDayData.absence.map((entry, index) => (
                      <TeacherAbsenceItem
                        key={index}
                        entry={entry}
                        onTeacherClick={code =>
                          router.push(paths.teacher(code) as Href)
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Žádní chybějící učitelé.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ------------------------------
// Substitutions Table Component
// ------------------------------

function SubstitutionsTable({
  changes,
}: {
  changes: Record<string, (ChangeEntry | null)[]>;
}) {
  const theme = useTheme();

  const sortedClasses = useMemo(() => {
    const classRegex = /([A-Z]+)(\d+)([a-z]*)/;
    return Object.keys(changes).sort((c1, c2) => {
      const m1 = c1.match(classRegex);
      const m2 = c2.match(classRegex);

      if (m1 && m2) {
        const numCompare = parseInt(m1[2], 10) - parseInt(m2[2], 10);
        if (numCompare !== 0) return numCompare;

        const preCompare = m1[1].localeCompare(m2[1]);
        if (preCompare !== 0) return preCompare;

        return m1[3].localeCompare(m2[3]);
      }
      return c1.localeCompare(c2);
    });
  }, [changes]);

  const maxHours = useMemo(() => {
    let max = 0;
    Object.values(changes).forEach(arr => {
      if (arr.length > max) max = arr.length;
    });
    return max;
  }, [changes]);

  const CELL_WIDTH = 80;

  if (sortedClasses.length === 0) {
    return (
      <Text
        style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}
      >
        Žádné změny
      </Text>
    );
  }

  return (
    <Card mode="outlined" style={{ overflow: 'hidden' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <TableCell text="" isHeader width={CELL_WIDTH} />
            {Array.from({ length: maxHours }).map((_, i) => (
              <TableCell
                key={i}
                text={String(i + 1)}
                isHeader
                width={CELL_WIDTH}
              />
            ))}
          </View>

          {/* Data Rows */}
          {sortedClasses.map(className => {
            const classChanges = changes[className] || [];
            return (
              <View key={className} style={{ flexDirection: 'row' }}>
                <TableCell text={className} isHeader width={CELL_WIDTH} />
                {Array.from({ length: maxHours }).map((_, hourIndex) => {
                  const change = classChanges[hourIndex];
                  return (
                    <TableCell
                      key={hourIndex}
                      text={change?.text || ''}
                      width={CELL_WIDTH}
                      backgroundColor={formatAndroidColor(
                        change?.backgroundColor
                      )}
                      foregroundColor={formatAndroidColor(
                        change?.foregroundColor
                      )}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Card>
  );
}

function TableCell({
  text,
  width,
  isHeader = false,
  backgroundColor,
  foregroundColor,
}: {
  text: string;
  width: number;
  isHeader?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tableCell,
        {
          width,
          borderColor: theme.colors.outlineVariant,
          backgroundColor: backgroundColor || 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.tableCellText,
          isHeader && { fontWeight: 'bold' },
          {
            color:
              foregroundColor ||
              (isHeader
                ? theme.colors.onSurfaceVariant
                : theme.colors.onSurface),
          },
        ]}
        numberOfLines={4}
        ellipsizeMode="tail"
      >
        {text}
      </Text>
    </View>
  );
}

// ------------------------------
// Teacher Absence Item Component
// ------------------------------

function TeacherAbsenceItem({
  entry,
  onTeacherClick,
}: {
  entry: AbsenceEntry;
  onTeacherClick: (code: string) => void;
}) {
  const theme = useTheme();

  let teacherName: string | null = null;
  let teacherCode: string | null = null;
  let typeText = '';

  if (entry.type !== 'invalid') {
    teacherName = entry.teacher;
    teacherCode = entry.teacherCode;
  }

  switch (entry.type) {
    case 'wholeDay':
      typeText = 'Celý den';
      break;
    case 'single':
      typeText = `${entry.hours}. hodina`;
      break;
    case 'range':
      typeText = `${entry.hours.from}. - ${entry.hours.to}. hodina`;
      break;
    case 'exkurze':
      typeText = 'Exkurze';
      break;
    case 'zastoupen':
      typeText = `Zastoupen: ${entry.zastupuje.teacher || 'Neznámý'}`;
      break;
    case 'invalid':
      typeText = `Neznámý formát: ${entry.original}`;
      break;
  }

  return (
    <Card
      style={{ backgroundColor: theme.colors.surfaceVariant }}
      onPress={
        teacherCode && teacherName
          ? () => onTeacherClick(teacherCode as string)
          : undefined
      }
    >
      <Card.Content style={{ paddingVertical: 12 }}>
        <Text style={{ fontWeight: 'bold' }}>
          {teacherName || 'Neznámý učitel'}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
        >
          {typeText}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  infoText: {
    fontSize: 12,
    marginBottom: 8,
  },
  tableCell: {
    height: 60,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  tableCellText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
