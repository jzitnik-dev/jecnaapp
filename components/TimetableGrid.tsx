import React, { useEffect, useState } from 'react';
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
import type {
  ExtraordinaryTimetable,
  TimetableDay,
  TimetableLesson,
  TimetablePeriod,
} from '../api/SpseJecnaClient';
import * as SecureStore from 'expo-secure-store';

type BaseProps = {
  periods: TimetablePeriod[];
  days: TimetableDay[];
  style?: any;
  onTeacherPress?: (teacherCode: string, teacherFull?: string) => void;
  onRoomPress?: (roomCode: string) => void;
};

type WithExtraordinary = BaseProps & {
  extraordinary: ExtraordinaryTimetable;
  class: string;
};

type WithoutExtraordinary = BaseProps & {
  extraordinary?: undefined | null;
  class?: string;
};

type TimetableGridProps = WithExtraordinary | WithoutExtraordinary;

export function TimetableGrid({
  periods,
  days,
  style,
  onTeacherPress,
  onRoomPress,
  extraordinary,
  class: className,
}: TimetableGridProps) {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const periodCount = periods.length;
  const cellWidth = Math.max(
    120,
    Math.floor((screenWidth - 24) / (periodCount + 1))
  );
  const [showCurrent, setShowCurrent] = useState(false);
  useEffect(() => {
    (async () => {
      setShowCurrent(
        (await SecureStore.getItemAsync('show-current-hour')) == 'true'
      );
    })();
  }, []);

  // Use theme colors instead of hardcoded dark/light colors
  const tableBg = theme.colors.surface;
  const cellBg = theme.colors.surfaceVariant;
  const extraCellBg = theme.colors.primary;
  const extraCellBgOn = theme.colors.onPrimary;
  const headerBg = theme.colors.surface;
  const textColor = theme.colors.onSurface;
  const borderColor = theme.colors.outline;
  const secondaryTextColor = theme.colors.onSurfaceVariant;
  const accentColor = theme.colors.primary;

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLesson, setModalLesson] = useState<TimetableLesson | null>(null);

  const handleLessonPress = (lesson: TimetableLesson) => {
    setModalLesson(lesson);
    setModalVisible(true);
  };

  const handleTeacherPress = () => {
    if (modalLesson && onTeacherPress && modalLesson.teacher) {
      const code = modalLesson.teacher.trim().toUpperCase();
      const fullName = modalLesson.teacherFull || '';
      setModalVisible(false);
      setTimeout(() => onTeacherPress(code, fullName), 100);
    }
  };

  const handleRoomPress = () => {
    if (modalLesson && onRoomPress && modalLesson.room) {
      const code = modalLesson.room;
      setModalVisible(false);
      setTimeout(() => onRoomPress(code), 100);
    }
  };

  const date = new Date();
  const dayNumberMondayStart =
    date.getDay() === 0 ? -1 : date.getDay() === 6 ? -2 : date.getDay() - 1;

  function isCurrentPeriod(periodTime: string, dayName: string) {
    const dayMap: Record<string, number> = {
      Po: 1,
      Út: 2,
      St: 3,
      Čt: 4,
      Pa: 5,
      So: 6,
      Ne: 0,
    };

    const now = new Date();

    // Check if today matches the given day
    if (now.getDay() !== dayMap[dayName]) return false;

    const [startStr, endStr] = periodTime.split(' - ');
    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const start = new Date();
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    return now >= start && now <= end;
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
                {period.number}
              </Text>
              <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                {period.time}
              </Text>
            </View>
          ))}
        </View>
        <Divider style={{ height: 1, backgroundColor: borderColor }} />
        {/* Day rows */}
        {days.map((day, dayIdx) => {
          const isLast = dayIdx + 1 === days.length;
          const addDays = dayIdx - dayNumberMondayStart;
          const newDate = new Date(
            date.getTime() + addDays * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .slice(0, 10);

          const extraIndex = extraordinary?.props.findIndex(
            el => el.date === newDate
          );
          const isInExtra = extraIndex !== -1 && extraIndex !== undefined;
          const extra = isInExtra
            ? extraordinary?.schedule[extraIndex][className]
            : undefined;

          const cellHeight =
            Math.max(2, Math.max(...day.cells.map(cell => cell?.length || 1))) *
            45;

          return (
            <View key={day.day + dayIdx} style={styles.row}>
              <View
                style={[
                  styles.dayCell,
                  {
                    width: cellWidth,
                    backgroundColor: headerBg,
                    borderBottomLeftRadius: dayIdx === days.length - 1 ? 18 : 0,
                    minHeight: cellHeight,
                    borderColor,
                    borderBottomWidth: isLast ? 0 : 1,
                  },
                ]}
              >
                <Text style={[styles.dayText, { color: textColor }]}>
                  {day.day}
                </Text>
                {isInExtra && extraordinary?.props[extraIndex].priprava ? (
                  <Text style={{ color: secondaryTextColor }}>(příprava)</Text>
                ) : null}
              </View>
              {day.cells.map((cell, periodIdx) => {
                const isLastMult = periodIdx + 1 === day.cells.length;

                if (extra && extra[periodIdx]) {
                  return (
                    <View
                      key={periodIdx}
                      style={[
                        styles.cell,
                        {
                          width: cellWidth,
                          height: cellHeight,
                          backgroundColor: extraCellBg,
                          borderBottomRightRadius:
                            dayIdx === days.length - 1 &&
                            periodIdx === day.cells.length - 1
                              ? 18
                              : 0,
                          borderColor,
                          borderRightWidth:
                            periodIdx === day.cells.length - 1 ? 0 : 1,
                          borderBottomWidth: isLastMult && isLast ? 0 : 1,
                        },
                      ]}
                    >
                      <Text
                        ellipsizeMode="tail"
                        style={{ textAlign: 'center', color: extraCellBgOn }}
                      >
                        {extra[periodIdx]}
                      </Text>
                    </View>
                  );
                }
                const isSplit = cell && cell.length > 1;
                const isCurrent =
                  cell &&
                  cell.length > 0 &&
                  isCurrentPeriod(periods[periodIdx].time, day.day);
                function lightenHexColor(hex: string, percent: number) {
                  hex = hex.replace(/^#/, '');
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
                  <View
                    key={periodIdx}
                    style={[
                      styles.cell,
                      {
                        width: cellWidth,
                        height: cellHeight,
                        backgroundColor: cellBg,
                        borderBottomRightRadius:
                          dayIdx === days.length - 1 &&
                          periodIdx === day.cells.length - 1
                            ? 18
                            : 0,
                        borderColor,
                        borderRightWidth:
                          periodIdx === day.cells.length - 1 ? 0 : 1,
                        borderBottomWidth: isLast ? 0 : 1,
                      },
                    ]}
                  >
                    {cell && cell.length > 0
                      ? cell
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
                              <View
                                style={{
                                  position: 'absolute',
                                  top: 6,
                                  left: 6,
                                  right: 6,
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Text
                                  style={[
                                    styles.teacherSquare,
                                    {
                                      color: accentColor,
                                      fontSize: 12,
                                      flex: 1,
                                      marginRight: 4,
                                    },
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {lesson.teacher}
                                </Text>
                                {lesson.room ? (
                                  <View
                                    style={{
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.roomSquare,
                                        {
                                          color: accentColor,
                                          fontSize: 11,
                                          fontWeight: '500',
                                        },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {lesson.room}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                              <View
                                style={{
                                  flex: 1,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={[
                                    styles.subjectSquare,
                                    {
                                      color: textColor,
                                      fontSize: 15,
                                      fontWeight: '600',
                                      textAlign: 'center',
                                    },
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {lesson.subject}
                                </Text>
                                {lesson.group ? (
                                  <Text
                                    style={[
                                      styles.groupSquare,
                                      {
                                        color: secondaryTextColor,
                                        fontSize: 11,
                                        marginTop: 2,
                                        textAlign: 'center',
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
                {modalLesson.subjectLong}
              </Text>
              <Text style={{ marginBottom: 8 }}>
                Třída:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {modalLesson.className || '-'}
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
              >
                {modalLesson.room || 'Učebna'}
              </Button>
              <Button
                mode="contained"
                onPress={() => handleTeacherPress()}
                style={{ marginBottom: 8 }}
              >
                {modalLesson.teacherFull || modalLesson.teacher || 'Učitel'}
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
    borderColor: 'white',
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
  modal: {
    margin: 24,
    borderRadius: 18,
    padding: 24,
    alignSelf: 'center',
    minWidth: 280,
    maxWidth: 400,
  },
});
