import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  useTheme,
} from 'react-native-paper';
import { ImageViewer } from '../../components/ImageViewer';
import { AbsenceCard } from '../../components/dashboard/AbsenceCard';
import { GradeCard } from '../../components/dashboard/GradeCard';
import { NextLessonCard } from '../../components/dashboard/NextLessonCard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { calculateGradeStats } from '../../utils/dashboardUtils';
import * as SecureStore from 'expo-secure-store';
import { LockerCard } from '@/components/dashboard/LockerCard';

export default function HomeScreen() {
  const theme = useTheme();
  const { grades, timetable, accountInfo, loading, error, locker, refresh } =
    useDashboardData();
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  useEffect(() => {
    (async () => {
      setShowProfilePicture(
        !((await SecureStore.getItemAsync('hide-profilepicture')) === 'true')
      );
    })();
  });

  const gradeStats = calculateGradeStats(grades);

  const handleRefresh = () => {
    refresh();
  };

  if (loading && grades.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.onBackground} />
        <Text
          style={[styles.loadingText, { color: theme.colors.onBackground }]}
        >
          Načítání dashboardu...
        </Text>
      </View>
    );
  }

  if (error && grades.length === 0) {
    return (
      <View
        style={[
          styles.errorContainer,
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
        <Button
          mode="contained"
          onPress={handleRefresh}
          style={styles.retryButton}
          icon="refresh"
        >
          Zkusit znovu
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Welcome Header */}
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
                style={[
                  styles.quickStatValue,
                  { color: theme.colors.onPrimary },
                ]}
              >
                {gradeStats.average}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.quickStatLabel,
                  { color: theme.colors.onPrimary },
                ]}
              >
                Průměr
              </Text>
            </View>

            <View style={styles.quickStat}>
              <Text
                variant="titleLarge"
                style={[
                  styles.quickStatValue,
                  { color: theme.colors.onPrimary },
                ]}
              >
                {gradeStats.totalGrades}
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.quickStatLabel,
                  { color: theme.colors.onPrimary },
                ]}
              >
                Známek
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Next Lesson Card */}
      <NextLessonCard timetable={timetable} />

      {/* Grade Statistics Card */}
      <GradeCard gradeStats={gradeStats} grades={grades} />

      {/* Absence Card */}
      <AbsenceCard />

      <LockerCard lockerData={locker} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    marginTop: 16,
  },
  welcomeCard: {
    margin: 16,
    borderRadius: 20,
  },
  welcomeContent: {
    paddingVertical: 8,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  welcomeClass: {
    opacity: 0.9,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  quickStatLabel: {
    marginTop: 4,
    opacity: 0.9,
  },
  cacheInfo: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
  },
  cacheText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
