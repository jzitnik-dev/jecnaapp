import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type {
  ExtraordinaryTimetable,
  Timetable,
} from '../../api/SpseJecnaClient';
import type { LessonInfo, StaticLesson } from '../../utils/dashboardUtils';
import { getCurrentAndNextLesson } from '../../utils/dashboardUtils';
import { useSpseJecnaClient } from '@/hooks/useSpseJecnaClient';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAccountInfo } from '@/hooks/useAccountInfo';

interface NextLessonCardProps {
  timetable?: Timetable | null;
}

export function NextLessonCard({ timetable }: NextLessonCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [lessonInfo, setLessonInfo] = useState<{
    currentLessons: LessonInfo[];
    nextLessons: LessonInfo[];
  }>({ currentLessons: [], nextLessons: [] });
  const { client } = useSpseJecnaClient();

  const [extraenabled, setExtraenabled] = useState(false);
  useEffect(() => {
    (async () => {
      const enabled =
        (await SecureStore.getItemAsync('extraordinary_schedule_enabled')) ===
        'true';
      if (enabled) {
        setExtraenabled(true);
      }
    })();
  }, []);

  const { data: extraordinaryData } = useQuery<ExtraordinaryTimetable>({
    queryKey: ['extraordinarytimetable'],
    queryFn: async () => {
      if (!client) throw new Error('Not logged in');
      return await client.getExtraordinaryTimetable();
    },
    enabled: !!client && extraenabled,
  });

  const { accountInfo } = useAccountInfo();

  useEffect(() => {
    if (!timetable || !client || !accountInfo?.class) return;

    const updateLessonInfo = async () => {
      const info = await getCurrentAndNextLesson(
        timetable,
        extraordinaryData,
        accountInfo?.class
      );
      setLessonInfo(info);
    };

    updateLessonInfo();
    const interval = setInterval(updateLessonInfo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timetable, client, extraordinaryData, accountInfo]);

  const { currentLessons, nextLessons } = lessonInfo;

  const handleTeacherPress = (teacherCode: string) => {
    router.push(`/teachers/${teacherCode}`);
  };

  const handleRoomPress = (room: string) => {
    router.push(`/ucebna/${room}`);
  };

  if (!timetable) {
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
              name="calendar-blank"
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
              Rozvrh není k dispozici
            </Text>
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
