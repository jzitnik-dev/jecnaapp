import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type { LessonInfo, StaticLesson } from '@/utils/dashboard/nextClass';
import { getCurrentAndNextLesson } from '@/utils/dashboard/nextClass';
import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useAccountInfo } from '@/hooks/useAccountInfo';
import { TimetablePage } from 'jecnaapi-react-native/jecnaapi';
import { SuplResult } from '@jzitnik/jecna_supl_client_ts';
import Skeleton from '../ui/Skeleton';

interface NextLessonCardProps {
  timetable?: TimetablePage | null;
  extraord?: SuplResult | null;
}

export function NextLessonCard({ timetable, extraord }: NextLessonCardProps) {
  const theme = useTheme();
  const isDark = theme.dark;
  const router = useRouter();
  const [lessonInfo, setLessonInfo] = useState<{
    currentLessons: LessonInfo[];
    nextLessons: LessonInfo[];
  }>({ currentLessons: [], nextLessons: [] });
  const { client } = useSpseJecnaClient();
  const { accountInfo } = useAccountInfo();

  useEffect(() => {
    if (!timetable || !client || !accountInfo?.className) return;

    const updateLessonInfo = async () => {
      const info = await getCurrentAndNextLesson(timetable, extraord);
      setLessonInfo(info);
    };

    updateLessonInfo();
    const interval = setInterval(updateLessonInfo, 30000);

    return () => clearInterval(interval);
  }, [timetable, client, extraord, accountInfo]);

  const { currentLessons, nextLessons } = lessonInfo;

  const handleTeacherPress = (teacherCode: string) => {
    router.push(`/teachers/${teacherCode}`);
  };

  const handleRoomPress = (room: string) => {
    router.push(`/ucebna/${room}`);
  };

  const isLoading = !timetable;

  if (isLoading) {
    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={3}
      >
        <Card.Content>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={theme.colors.onSurface}
              style={{ marginRight: 8 }}
            />
            <Text
              variant="titleLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Rozvrh hodin
            </Text>
          </View>

          <View
            style={[
              styles.lessonContainer,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.03)',
              },
            ]}
          >
            <View style={styles.lessonHeader}>
              <View style={styles.statusContainer}>
                <Skeleton
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                  isDark={isDark}
                />
                <Skeleton style={{ width: 100, height: 20 }} isDark={isDark} />
              </View>
              <View style={styles.countdownContainer}>
                <Skeleton
                  style={{ width: 40, height: 24, marginBottom: 4 }}
                  isDark={isDark}
                />
                <Skeleton style={{ width: 60, height: 14 }} isDark={isDark} />
              </View>
            </View>

            <View style={styles.subjectContainer}>
              <Skeleton
                style={{ width: 150, height: 28, marginBottom: 8 }}
                isDark={isDark}
              />
              <Skeleton
                style={{ width: 100, height: 16, marginBottom: 8 }}
                isDark={isDark}
              />
            </View>

            <View style={styles.lessonDetails}>
              <View style={styles.detailRow}>
                <Skeleton
                  style={{ width: 20, height: 20, borderRadius: 10 }}
                  isDark={isDark}
                />
                <Skeleton style={{ width: 140, height: 16 }} isDark={isDark} />
              </View>
              <View style={styles.detailRow}>
                <Skeleton
                  style={{ width: 20, height: 20, borderRadius: 10 }}
                  isDark={isDark}
                />
                <Skeleton style={{ width: 80, height: 16 }} isDark={isDark} />
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (!currentLessons.length && !nextLessons.length) {
    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={3}
      >
        <Card.Content>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={theme.colors.onSurface}
              style={{ marginRight: 8 }}
            />
            <Text
              variant="titleLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Rozvrh hodin
            </Text>
          </View>
          <View style={styles.noLessonContainer}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyLarge"
              style={[
                styles.noLessonText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Žádné další hodiny dnes
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const renderLessonDetails = (lesson: StaticLesson) => {
    return (
      <View style={styles.lessonDetails}>
        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => handleTeacherPress(lesson.teacherCode)}
        >
          <MaterialCommunityIcons
            name="account"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyMedium"
            style={[styles.detailText, { color: theme.colors.primary }]}
          >
            {lesson.teacherFull}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailRow}
          onPress={() => handleRoomPress(lesson.room)}
        >
          <MaterialCommunityIcons
            name="door"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyMedium"
            style={[styles.detailText, { color: theme.colors.secondary }]}
          >
            {lesson.room}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        {lesson.group && (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="account-multiple"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyMedium"
              style={[styles.detailText, { color: theme.colors.secondary }]}
            >
              {lesson.group}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={3}
    >
      <Card.Content>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={24}
            color={theme.colors.onSurface}
            style={{ marginRight: 8 }}
          />
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Rozvrh hodin
          </Text>
        </View>

        {/* Current Lessons */}
        {currentLessons.map((lesson, index) => {
          if (lesson.kind === 'extraordinary') {
            return (
              <View
                key={index}
                style={[styles.lessonContainer, styles.currentLesson]}
              >
                <View style={styles.lessonHeader}>
                  <View style={styles.statusContainer}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.statusText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Mimořádná změna!
                    </Text>
                  </View>

                  <View style={styles.countdownContainer}>
                    <Text
                      variant="titleMedium"
                      style={[styles.countdown, { color: theme.colors.error }]}
                    >
                      {lesson.timeUntilEnd}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.countdownLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      do konce
                    </Text>
                  </View>
                </View>

                <View style={styles.subjectContainer}>
                  <Text
                    variant="headlineSmall"
                    style={[styles.subject, { color: theme.colors.primary }]}
                  >
                    {lesson.extraOrdinaryData}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.time,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {lesson.time} • {lesson.period}. hodina
                  </Text>
                </View>
              </View>
            );
          }

          return (
            <View
              key={index}
              style={[styles.lessonContainer, styles.currentLesson]}
            >
              <View style={styles.lessonHeader}>
                <View style={styles.statusContainer}>
                  <MaterialCommunityIcons
                    name="play-circle"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="titleMedium"
                    style={[styles.statusText, { color: theme.colors.primary }]}
                  >
                    Právě probíhá
                  </Text>
                </View>

                <View style={styles.countdownContainer}>
                  <Text
                    variant="titleMedium"
                    style={[styles.countdown, { color: theme.colors.error }]}
                  >
                    {lesson.timeUntilEnd}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.countdownLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    do konce
                  </Text>
                </View>
              </View>

              <View style={styles.subjectContainer}>
                <Text
                  variant="headlineSmall"
                  style={[styles.subject, { color: theme.colors.primary }]}
                >
                  {lesson.subject}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.time,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {lesson.time} • {lesson.period}. hodina
                </Text>
              </View>

              {renderLessonDetails(lesson)}
            </View>
          );
        })}

        {/* Next Lessons */}
        {nextLessons.map((lesson, index) => {
          if (lesson.kind === 'extraordinary') {
            return (
              <View
                key={index}
                style={[styles.lessonContainer, styles.nextLesson]}
              >
                <View style={styles.lessonHeader}>
                  <View style={styles.statusContainer}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={24}
                      color={theme.colors.secondary}
                    />
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.statusText,
                        { color: theme.colors.secondary },
                      ]}
                    >
                      Mimořádná změna
                    </Text>
                  </View>

                  <View style={styles.countdownContainer}>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.countdown,
                        { color: theme.colors.secondary },
                      ]}
                    >
                      {lesson.timeUntilStart}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.countdownLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      do začátku
                    </Text>
                  </View>
                </View>

                <View style={styles.subjectContainer}>
                  <Text
                    variant="headlineSmall"
                    style={[styles.subject, { color: theme.colors.secondary }]}
                  >
                    {lesson.extraOrdinaryData}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.time,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {lesson.time} • {lesson.period}. hodina
                  </Text>
                </View>
              </View>
            );
          }
          return (
            <View
              key={index}
              style={[styles.lessonContainer, styles.nextLesson]}
            >
              <View style={styles.lessonHeader}>
                <View style={styles.statusContainer}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={24}
                    color={theme.colors.secondary}
                  />
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.statusText,
                      { color: theme.colors.secondary },
                    ]}
                  >
                    Další hodina
                  </Text>
                </View>

                <View style={styles.countdownContainer}>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.countdown,
                      { color: theme.colors.secondary },
                    ]}
                  >
                    {lesson.timeUntilStart}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.countdownLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    do začátku
                  </Text>
                </View>
              </View>

              <View style={styles.subjectContainer}>
                <Text
                  variant="headlineSmall"
                  style={[styles.subject, { color: theme.colors.secondary }]}
                >
                  {lesson.subject}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.time,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {lesson.time} • {lesson.period}. hodina
                </Text>
              </View>

              {renderLessonDetails(lesson)}
            </View>
          );
        })}
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
  noLessonContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noLessonText: {
    marginTop: 12,
    textAlign: 'center',
  },
  lessonContainer: {
    gap: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  currentLesson: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  nextLesson: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontWeight: 'bold',
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdown: {
    fontWeight: 'bold',
  },
  countdownLabel: {
    marginTop: 2,
  },
  subjectContainer: {
    flex: 1,
  },
  subject: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  time: {
    fontWeight: '500',
  },
  lessonDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  detailText: {
    fontWeight: '500',
    flex: 1,
  },
});
