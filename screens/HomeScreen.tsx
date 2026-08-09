import { useMemo, useCallback } from 'react';
import { RefreshControl, StyleSheet, View, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

import { AbsenceCard } from '@/components/dashboard/AbsenceCard';
import { GradeCard } from '@/components/dashboard/GradeCard';
import { NextLessonCard } from '@/components/dashboard/NextLessonCard';
import { LockerCard } from '@/components/dashboard/LockerCard';
import { CanteenCard } from '@/components/dashboard/CanteenCard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { calculateGradeStats } from '@/utils/dashboard/grades';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import { useSecureStore } from '@/hooks/useSecureStore';

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
export default function HomeScreen() {
  const theme = useTheme();
  const {
    grades,
    timetable,
    accountInfo,
    locker,
    canteen,
    absences,
    loading,
    refresh,
    extraord,
  } = useDashboardData();

  const [widgets] = useSecureStore<Widget[]>('widgetSettings', {
    initialValue: DEFAULT_WIDGETS,
    parse: val => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : DEFAULT_WIDGETS;
      } catch (e) {
        console.error('Error parsing widget settings', e);
        return DEFAULT_WIDGETS;
      }
    },
    stringify: val => JSON.stringify(val),
  });

  const gradeStats = useMemo(() => calculateGradeStats(grades), [grades]);

  const enabledWidgets = useMemo(
    () => widgets.filter(w => w.enabled),
    [widgets]
  );

  function renderWidget(widget: Widget) {
    switch (widget.component) {
      case 'WelcomeCard':
        return (
          <WelcomeCard
            key={widget.id}
            accountInfo={accountInfo}
            gradeStats={gradeStats}
            theme={theme}
          />
        );

      case 'NextLessonCard':
        return (
          <NextLessonCard
            key={widget.id}
            timetable={timetable}
            extraord={extraord}
          />
        );

      case 'CanteenCard':
        return canteen ? (
          <CanteenCard key={widget.id} canteen={canteen} />
        ) : null;

      case 'GradeCard':
        return (
          <GradeCard key={widget.id} gradeStats={gradeStats} grades={grades} />
        );

      case 'AbsenceCard':
        return <AbsenceCard key={widget.id} data={absences} />;

      case 'LockerCard':
        return <LockerCard key={widget.id} lockerData={locker} />;

      default:
        return null;
    }
  }

  const handleRefresh = useCallback(() => refresh(), [refresh]);

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
});
