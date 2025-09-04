import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  RefreshControl,
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Text, ActivityIndicator, useTheme, Card } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';

import { ImageViewer } from '@/components/ImageViewer';
import { AbsenceCard } from '@/components/dashboard/AbsenceCard';
import { GradeCard } from '@/components/dashboard/GradeCard';
import { NextLessonCard } from '@/components/dashboard/NextLessonCard';
import { LockerCard } from '@/components/dashboard/LockerCard';
import { CanteenCard } from '@/components/dashboard/CanteenCard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { calculateGradeStats } from '@/utils/dashboardUtils';

interface Widget {
  id: string;
  name: string;
  component: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'welcome',
    name: 'Vítej zpět',
    component: 'WelcomeCard',
    icon: 'home',
    enabled: true,
  },
  {
    id: 'nextLesson',
    name: 'Další hodina',
    component: 'NextLessonCard',
    icon: 'clock',
    enabled: true,
  },
  {
    id: 'canteen',
    name: 'Jídelna',
    component: 'CanteenCard',
    icon: 'food',
    enabled: true,
  },
  {
    id: 'grades',
    name: 'Známky',
    component: 'GradeCard',
    icon: 'school',
    enabled: true,
  },
  {
    id: 'absence',
    name: 'Absence',
    component: 'AbsenceCard',
    icon: 'calendar-remove',
    enabled: true,
  },
  {
    id: 'locker',
    name: 'Skříňka',
    component: 'LockerCard',
    icon: 'locker',
    enabled: true,
  },
];

const WelcomeCard = React.memo(
  ({ accountInfo, gradeStats, showProfilePicture, theme }: any) => (
    <Card
      style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}
      elevation={4}
    >
      <Card.Content style={styles.welcomeContent}>
        <View style={styles.welcomeHeader}>
          {showProfilePicture && (
            <View style={{ marginRight: 16 }}>
              <ImageViewer
                imageUrl={accountInfo?.photoUrl}
                size={60}
                fallbackSource={require('../../assets/images/icon.png')}
              />
            </View>
          )}
          <View style={styles.welcomeText}>
            <Text
              variant="headlineSmall"
              style={[styles.welcomeTitle, { color: theme.colors.onPrimary }]}
            >
              Vítej zpět!
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.welcomeSubtitle,
                { color: theme.colors.onPrimary },
              ]}
            >
              {accountInfo?.fullName || 'Student'}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.welcomeClass, { color: theme.colors.onPrimary }]}
            >
              {accountInfo?.username || ''} • {accountInfo?.class || ''} •{' '}
              {accountInfo?.groups}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text
              variant="titleLarge"
              style={[styles.quickStatValue, { color: theme.colors.onPrimary }]}
            >
              {gradeStats.average}
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.quickStatLabel, { color: theme.colors.onPrimary }]}
            >
              Průměr
            </Text>
          </View>

          <View style={styles.quickStat}>
            <Text
              variant="titleLarge"
              style={[styles.quickStatValue, { color: theme.colors.onPrimary }]}
            >
              {gradeStats.totalGrades}
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.quickStatLabel, { color: theme.colors.onPrimary }]}
            >
              Známek
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  )
);
WelcomeCard.displayName = 'WelcomeCard';

export default function HomeScreen() {
  const theme = useTheme();
  const {
    grades,
    timetable,
    accountInfo,
    locker,
    canteen,
    loading,
    refresh,
    error,
  } = useDashboardData();

  const [showProfilePicture] = useState(true);
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);

  const gradeStats = useMemo(() => calculateGradeStats(grades), [grades]);

  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const saved = await SecureStore.getItemAsync('widgetSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setWidgets(parsed);
        }
      } catch (e) {
        console.error('Error loading widget settings', e);
      }
    };
    loadWidgets();
  }, []);

  const enabledWidgets = useMemo(
    () => widgets.filter(w => w.enabled),
    [widgets]
  );

  const renderWidget = useCallback(
    (widget: Widget) => {
      switch (widget.component) {
        case 'WelcomeCard':
          return (
            <WelcomeCard
              key={widget.id}
              accountInfo={accountInfo}
              gradeStats={gradeStats}
              showProfilePicture={showProfilePicture}
              theme={theme}
            />
          );
        case 'NextLessonCard':
          return <NextLessonCard key={widget.id} timetable={timetable} />;
        case 'CanteenCard':
          return canteen ? (
            <CanteenCard key={widget.id} canteen={canteen} />
          ) : null;
        case 'GradeCard':
          return (
            <GradeCard
              key={widget.id}
              gradeStats={gradeStats}
              grades={grades}
            />
          );
        case 'AbsenceCard':
          return <AbsenceCard key={widget.id} />;
        case 'LockerCard':
          return <LockerCard key={widget.id} lockerData={locker} />;
        default:
          return null;
      }
    },
    [
      accountInfo,
      gradeStats,
      showProfilePicture,
      theme,
      timetable,
      canteen,
      grades,
      locker,
    ]
  );

  const handleRefresh = useCallback(() => refresh(), [refresh]);

  if (loading && grades.length === 0)
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.statusText, { color: theme.colors.onBackground }]}>
          Načítání dashboardu...
        </Text>
      </View>
    );

  if (error && grades.length === 0)
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.error}
        />
        <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
          Chyba při načítání
        </Text>
        <Text
          style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}
        >
          {error}
        </Text>
        <Pressable onPress={handleRefresh} style={styles.retryButton}>
          <Text
            style={[styles.retryButtonText, { color: theme.colors.primary }]}
          >
            Zkusit znovu
          </Text>
        </Pressable>
      </View>
    );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {enabledWidgets.map(renderWidget)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  statusText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { fontSize: 16, fontWeight: '600' },
  welcomeCard: { margin: 16, borderRadius: 20 },
  welcomeContent: { paddingVertical: 12 },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePictureContainer: { marginRight: 16 },
  welcomeText: { flex: 1 },
  welcomeTitle: { fontWeight: 'bold', marginBottom: 4 },
  welcomeSubtitle: { fontWeight: '600', marginBottom: 2 },
  welcomeClass: { opacity: 0.9 },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  quickStat: { alignItems: 'center' },
  quickStatValue: { fontWeight: 'bold', fontSize: 28 },
  quickStatLabel: { marginTop: 4, opacity: 0.9 },
});
