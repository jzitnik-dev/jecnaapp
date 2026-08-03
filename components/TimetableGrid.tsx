import { useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  Button,
  Divider,
  Modal,
  Portal,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import {
  DayOfWeek,
  Lesson,
  LessonPeriod,
  Timetable,
} from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { formatTime } from '@/utils/dateUtils';
import { useSecureStore } from '@/hooks/useSecureStore';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';

type TimetableGridProps = {
  timetable: Timetable;
  style?: any;
  onTeacherPress?: (teacherCode: string, teacherFull?: string) => void;
  onRoomPress?: (roomCode: string) => void;
  extraordinary?: SuplResult;
  showClass?: boolean;
  showExtraordinary?: boolean;
};

const DAYS_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Po',
  TUESDAY: 'Út',
  WEDNESDAY: 'St',
  THURSDAY: 'Čt',
  FRIDAY: 'Pá',
  SATURDAY: 'So',
  SUNDAY: 'Ne',
};

export function TimetableGrid({
  timetable,
  style,
  onTeacherPress,
  onRoomPress,
  extraordinary,
  showClass = true,
  showExtraordinary = true,
}: TimetableGridProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const periods = timetable.lessonPeriods;
  const presentDays = DAYS_ORDER.filter(day => timetable.timetable[day]);

  const periodCount = periods.length;
  const cellWidth = Math.max(
    120,
    Math.floor((screenWidth - 24) / (periodCount + 1))
  );

  const [showCurrent] = useSecureStore<boolean>('show-current-hour', {
    initialValue: true,
    parse: val => val === 'true',
    stringify: val => (val ? 'true' : 'false'),
  });

  const tableBg = theme.colors.surface;
  const cellBg = theme.colors.surfaceVariant;
  const extraCellBg = theme.colors.primary;
  const extraCellBgOn = theme.colors.onPrimary;
  const headerBg = theme.colors.surface;
  const textColor = theme.colors.onSurface;
  const borderColor = theme.colors.outline;
  const secondaryTextColor = theme.colors.onSurfaceVariant;
  const accentColor = theme.colors.primary;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalLesson, setModalLesson] = useState<Lesson | null>(null);

  const handleLessonPress = (lesson: Lesson) => {
    setModalLesson(lesson);
    setModalVisible(true);
  };

  const handleTeacherPress = () => {
    if (modalLesson && onTeacherPress && modalLesson.teacherName) {
      const code = (
        modalLesson.teacherName.short || modalLesson.teacherName.full
      )
        .trim()
        .toUpperCase();
      const fullName = modalLesson.teacherName.full || '';
      setModalVisible(false);
      setTimeout(() => onTeacherPress(code, fullName), 100);
    }
  };

  const handleRoomPress = () => {
    if (modalLesson && onRoomPress && modalLesson.classroom) {
      const code = modalLesson.classroom;
      setModalVisible(false);
      setTimeout(() => onRoomPress(code), 100);
    }
  };

  const date = new Date();
  const dayNumberMondayStart =
    date.getDay() === 0 ? -1 : date.getDay() === 6 ? -2 : date.getDay() - 1;

  function isCurrentPeriod(period: LessonPeriod, dayName: DayOfWeek) {
    const dayMap: Record<DayOfWeek, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 0,
    };

    const now = new Date();
    if (now.getDay() !== dayMap[dayName]) return false;

    const startHour = period.from.hour;
    const startMin = period.from.minute;
    const endHour = period.to.hour;
    const endMin = period.to.minute;

    const start = new Date();
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    return now >= start && now <= end;
  }

  function lightenHexColor(hex: string, percent: number) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 8) hex = hex.slice(0, 6);
    const num = parseInt(hex, 16);
    let r = (num >> 16) + Math.round(255 * percent);
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
    let b = (num & 0x0000ff) + Math.round(255 * percent);
    r = r > 255 ? 255 : r;
    g = g > 255 ? 255 : g;
    b = b > 255 ? 255 : b;
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  return (
    <>
      <Surface
        style={[
          styles.table,
          { backgroundColor: tableBg, borderRadius: 18, borderColor },
          style,
        ]}
        elevation={3}
      >
        {/* Header row */}
        <View
          style={[
            styles.row,
            styles.stickyHeader,
            Platform.OS === 'web'
              ? { position: 'sticky', top: 0, zIndex: 10 }
              : {},
          ]}
        >
          <View
            style={[
              styles.headerCell,
              {
                width: cellWidth,
                backgroundColor: headerBg,
                borderTopLeftRadius: 18,
                borderColor,
                borderRightWidth: 1,
              },
            ]}
          >
            <Text style={[styles.headerText, { color: textColor }]}> </Text>
          </View>
          {periods.map((period, idx) => (
            <View
              key={idx}
              style={[
                styles.headerCell,
                {
                  width: cellWidth,
                  backgroundColor: headerBg,
                  borderTopRightRadius: idx === periods.length - 1 ? 18 : 0,
                  borderColor,
                  borderRightWidth: idx === periods.length - 1 ? 0 : 1,
                },
              ]}
            >
              <Text style={[styles.headerText, { color: textColor }]}>
                {idx + 1}
              </Text>
              <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                {`${formatTime(period.from)} - ${formatTime(period.to)}`}
              </Text>
            </View>
          ))}
        </View>
        <Divider style={{ height: 1, backgroundColor: borderColor }} />

        {presentDays.map((dayKey, dayIdx) => {
          const spots = timetable.timetable[dayKey];
          const isLast = dayIdx + 1 === presentDays.length;

          // Date logic exactly from legacy
          const dayIndexInWeek = DAYS_ORDER.indexOf(dayKey);
          const addDays = dayIndexInWeek - dayNumberMondayStart;
          const targetDate = new Date(
            date.getTime() + addDays * 24 * 60 * 60 * 1000
          );

          const year = targetDate.getFullYear();
          const month = String(targetDate.getMonth() + 1).padStart(2, '0');
          const dayString = String(targetDate.getDate()).padStart(2, '0');
          const newDate = `${year}-${month}-${dayString}`;

          // Only retrieve extraordinary schedule if showExtraordinary is true
          const dailySchedule = showExtraordinary
            ? extraordinary?.schedule?.[newDate]
            : undefined;
          const extraChanges = dailySchedule?.changes;

          const maxLessonsInSpot = Math.max(
            1,
            ...spots.map(spot => spot.lessons.length)
          );
          const cellHeight = Math.max(2, maxLessonsInSpot) * 45;

          return (
            <View key={dayKey} style={styles.row}>
              <View
                style={[
                  styles.dayCell,
                  {
                    width: cellWidth,
                    backgroundColor: headerBg,
                    borderBottomLeftRadius: isLast ? 18 : 0,
                    minHeight: cellHeight,
                    borderColor,
                    borderBottomWidth: isLast ? 0 : 1,
                  },
                ]}
              >
                <Text style={[styles.dayText, { color: textColor }]}>
                  {DAY_LABELS[dayKey]}
                </Text>
              </View>

              {spots.map((spot, spotIdx) => {
                const isSplit = spot.lessons && spot.lessons.length > 1;
                const periodIndexForSpot = spots
                  .slice(0, spotIdx)
                  .reduce((acc, s) => acc + s.periodSpan, 0);

                // Handle extraordinary substitution for this specific period
                const extraChange = extraChanges?.[periodIndexForSpot];

                if (extraChange) {
                  return (
                    <View
                      key={spotIdx}
                      style={[
                        styles.cell,
                        {
                          width: cellWidth * spot.periodSpan,
                          height: cellHeight,
                          backgroundColor: extraCellBg, // Ignored extraChange.backgroundColor
                          borderBottomRightRadius:
                            isLast && spotIdx === spots.length - 1 ? 18 : 0,
                          borderColor,
                          borderRightWidth:
                            spotIdx === spots.length - 1 ? 0 : 1,
                          borderBottomWidth: isLast ? 0 : 1,
                        },
                      ]}
                    >
                      <Text
                        ellipsizeMode="tail"
                        style={{
                          textAlign: 'center',
                          color: extraCellBgOn, // Ignored extraChange.foregroundColor
                          paddingHorizontal: 6,
                        }}
                      >
                        {extraChange.text}
                      </Text>
                    </View>
                  );
                }

                const period = periods[periodIndexForSpot];
                const isCurrent =
                  spot.lessons.length > 0 &&
                  period &&
                  isCurrentPeriod(period, dayKey);

                return (
                  <View
                    key={spotIdx}
                    style={[
                      styles.cell,
                      {
                        width: cellWidth * spot.periodSpan,
                        height: cellHeight,
                        backgroundColor: cellBg,
                        borderBottomRightRadius:
                          isLast && spotIdx === spots.length - 1 ? 18 : 0,
                        borderColor,
                        borderRightWidth: spotIdx === spots.length - 1 ? 0 : 1,
                        borderBottomWidth: isLast ? 0 : 1,
                      },
                    ]}
                  >
                    {spot.lessons && spot.lessons.length > 0
                      ? spot.lessons
                          .sort(
                            (a, b) =>
                              parseInt(a.group?.split('/')?.[0] || '0') -
                              parseInt(b.group?.split('/')?.[0] || '0')
                          )
                          .map((lesson, i) => (
                            <Pressable
                              key={i}
                              onPress={() => handleLessonPress(lesson)}
                              style={[
                                styles.lessonSquare,
                                {
                                  backgroundColor:
                                    isCurrent && showCurrent
                                      ? lightenHexColor(cellBg, 0.15)
                                      : cellBg,
                                  borderColor: borderColor,
                                  borderBottomWidth: isSplit && i === 0 ? 1 : 0,
                                  height: isSplit ? cellHeight / 2 : cellHeight,
                                  flex: 1,
                                },
                              ]}
                            >
                              <View style={styles.lessonHeaderRow}>
                                <Text
                                  style={[
                                    styles.teacherSquare,
                                    { color: accentColor, flex: 1 },
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {lesson.teacherName?.short ||
                                    lesson.teacherName?.full ||
                                    ''}
                                </Text>
                                {lesson.classroom ? (
                                  <View style={styles.roomContainer}>
                                    <Text
                                      style={[
                                        styles.roomSquare,
                                        { color: accentColor },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {lesson.classroom}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>

                              {showClass && lesson.clazz && (
                                <Text
                                  style={[
                                    styles.groupSquare,
                                    {
                                      color: accentColor,
                                      bottom: 6,
                                      left: 6,
                                      position: 'absolute',
                                    },
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {lesson.clazz}
                                </Text>
                              )}

                              <View style={styles.subjectContainer}>
                                <Text
                                  style={[
                                    styles.subjectSquare,
                                    { color: textColor },
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {lesson.subjectName.short ||
                                    lesson.subjectName.full}
                                </Text>
                                {lesson.group ? (
                                  <Text
                                    style={[
                                      styles.groupSquare,
                                      {
                                        color: secondaryTextColor,
                                        textAlign: 'center',
                                        marginTop: 2,
                                      },
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                  >
                                    {lesson.group}
                                  </Text>
                                ) : null}
                              </View>
                            </Pressable>
                          ))
                      : null}
                  </View>
                );
              })}
            </View>
          );
        })}
      </Surface>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          {modalLesson && (
            <View>
              <Text variant="titleLarge" style={{ marginBottom: 8 }}>
                {modalLesson.subjectName.full}
              </Text>
              <Text style={{ marginBottom: 8 }}>
                Třída:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {modalLesson.clazz || '-'}
                </Text>
              </Text>
              {modalLesson.group && (
                <Text style={{ marginBottom: 8 }}>
                  Skupina:{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {modalLesson.group}
                  </Text>
                </Text>
              )}
              <Button
                mode="contained"
                onPress={() => handleRoomPress()}
                style={{ marginBottom: 8 }}
                disabled={!modalLesson.classroom}
              >
                {modalLesson.classroom || 'Učebna'}
              </Button>
              <Button
                mode="contained"
                onPress={() => handleTeacherPress()}
                style={{ marginBottom: 8 }}
                disabled={!modalLesson.teacherName}
              >
                {modalLesson.teacherName?.full ||
                  modalLesson.teacherName?.short ||
                  'Učitel'}
              </Button>
              <Button
                onPress={() => setModalVisible(false)}
                style={{ marginTop: 8 }}
              >
                Zavřít
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
  },
  lessonSquare: {
    paddingLeft: 10,
    paddingVertical: 2,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    width: '100%',
    padding: 6,
  },
  lessonHeaderRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  subjectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherSquare: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  subjectSquare: {
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  roomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomSquare: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
  },
  groupSquare: {
    fontSize: 11,
    fontWeight: '500',
  },
  modal: {
    margin: 24,
    borderRadius: 18,
    padding: 24,
    alignSelf: 'center',
    minWidth: 280,
    maxWidth: 400,
  },
});
