import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Card, Text, useTheme } from 'react-native-paper';
import type { SubjectGrades } from '../../api/SpseJecnaClient';
import type { GradeStats } from '../../utils/dashboardUtils';
import {
  getGradeChartData,
  getGradeTrendChartData,
} from '../../utils/dashboardUtils';

interface GradeCardProps {
  gradeStats: GradeStats;
  grades: SubjectGrades[];
}

const screenWidth = Dimensions.get('window').width - 32; // Full width minus margins

export function GradeCard({ gradeStats, grades }: GradeCardProps) {
  const theme = useTheme();

  const chartData = useMemo(() => getGradeChartData(gradeStats), [gradeStats]);
  const trendData = useMemo(() => getGradeTrendChartData(grades), [grades]);

  function hexToRgba(hex: string, opacity = 1) {
    let r = 0,
      g = 0,
      b = 0;

    // Remove leading #
    if (hex[0] === '#') {
      hex = hex.slice(1);
    }

    // 3 digits hex
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);

      // 6 digits hex
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(theme.colors.primary, opacity),
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    yAxisLabel: '',
    yAxisSuffix: '',
    propsForLabels: {
      fontSize: 12,
    },
  };

  const lineChartConfig = {
    ...chartConfig,
    decimalPlaces: 1,
    strokeWidth: 2,
  };

  const renderBarChart = () => {
    try {
      const chartWidth = Math.max(screenWidth, chartData.labels.length * 60);

      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={180}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
          />
        </ScrollView>
      );
    } catch (error) {
      console.warn('Bar chart rendering error:', error);
      return (
        <View
          style={[
            styles.chartFallback,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text
            style={[
              styles.chartFallbackText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Rozložení známek:
          </Text>
          <View style={styles.gradeDistributionText}>
            <Text
              style={[
                styles.gradeText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              1: {gradeStats.gradeDistribution[1] || 0} | 2:{' '}
              {gradeStats.gradeDistribution[2] || 0} | 3:{' '}
              {gradeStats.gradeDistribution[3] || 0} | 4:{' '}
              {gradeStats.gradeDistribution[4] || 0} | 5:{' '}
              {gradeStats.gradeDistribution[5] || 0}
            </Text>
          </View>
        </View>
      );
    }
  };

  const renderLineChart = () => {
    try {
      if (
        !trendData ||
        !trendData.labels ||
        trendData.labels.length === 0 ||
        !trendData.datasets ||
        trendData.datasets.length === 0 ||
        !trendData.datasets[0].data ||
        trendData.datasets[0].data.length === 0
      ) {
        return (
          <View
            style={[
              styles.chartFallback,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text
              style={[
                styles.chartFallbackText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Trend známek:
            </Text>
            <Text
              style={[
                styles.gradeText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Žádná data s daty
            </Text>
          </View>
        );
      }

      const chartWidth = Math.max(screenWidth, trendData.labels.length * 60);

      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={trendData}
            width={chartWidth}
            height={180}
            chartConfig={lineChartConfig}
            style={styles.chart}
            bezier
            fromZero={false}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </ScrollView>
      );
    } catch (error) {
      console.warn('Line chart rendering error:', error);
      return (
        <View
          style={[
            styles.chartFallback,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text
            style={[
              styles.chartFallbackText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Trend známek:
          </Text>
          <Text
            style={[styles.gradeText, { color: theme.colors.onSurfaceVariant }]}
          >
            Chyba při vykreslování
          </Text>
        </View>
      );
    }
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={3}
    >
      <Card.Content>
        <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          <MaterialCommunityIcons
            name="chart-bar"
            size={24}
            color={theme.colors.onSurface}
          />
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Známky
          </Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <Text
              variant="headlineMedium"
              style={[styles.metricValue, { color: theme.colors.primary }]}
            >
              {gradeStats.average}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.metricLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Průměr
            </Text>
          </View>

          <View style={styles.metric}>
            <Text
              variant="headlineMedium"
              style={[styles.metricValue, { color: theme.colors.secondary }]}
            >
              {gradeStats.totalGrades}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.metricLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Celkem známek
            </Text>
          </View>

          <View style={styles.metric}>
            <Text
              variant="headlineMedium"
              style={[styles.metricValue, { color: theme.colors.tertiary }]}
            >
              {gradeStats.subjectsWithGrades}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.metricLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Předmětů
            </Text>
          </View>
        </View>

        {/* Grade Distribution Chart */}
        <View style={styles.chartContainer}>
          <Text
            variant="titleMedium"
            style={[styles.chartTitle, { color: theme.colors.onSurface }]}
          >
            Rozložení známek
          </Text>
          {renderBarChart()}
        </View>

        {/* Trend Chart */}
        <View style={styles.chartContainer}>
          <Text
            variant="titleMedium"
            style={[styles.chartTitle, { color: theme.colors.onSurface }]}
          >
            Trend známek (měsíc)
          </Text>
          {renderLineChart()}
        </View>

        {/* Best and Worst Subjects */}
        <View style={styles.subjectsContainer}>
          <View style={styles.subjectCard}>
            <View style={styles.subjectTitleContainer}>
              <MaterialCommunityIcons
                name="trophy"
                size={16}
                color={'#4CAF50'}
                style={{ marginRight: 4 }}
              />
              <Text
                variant="titleSmall"
                style={[styles.subjectTitle, { color: '#4CAF50' }]}
              >
                Nejlehčí předmět
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              style={[styles.subjectName, { color: theme.colors.onSurface }]}
            >
              {gradeStats.bestSubject.subject}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.subjectGrade,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Průměr: {gradeStats.bestSubject.average.toFixed(2)}
            </Text>
          </View>

          <View style={styles.subjectCard}>
            <View style={styles.subjectTitleContainer}>
              <MaterialCommunityIcons
                name="alert"
                size={16}
                color={'#F44336'}
                style={{ marginRight: 4 }}
              />
              <Text
                variant="titleSmall"
                style={[styles.subjectTitle, { color: '#F44336' }]}
              >
                Nejtěžší předmět
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              style={[styles.subjectName, { color: theme.colors.onSurface }]}
            >
              {gradeStats.worstSubject.subject}
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.subjectGrade,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Průměr: {gradeStats.worstSubject.average.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontWeight: 'bold',
    fontSize: 28,
  },
  metricLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  chartTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
    marginLeft: -20,
  },
  chartFallback: {
    width: screenWidth,
    height: 180,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartFallbackText: {
    fontSize: 16,
    textAlign: 'center',
  },
  subjectsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectCard: {
    flex: 1,
    padding: 12,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    marginHorizontal: 4,
  },
  subjectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectTitle: {
    fontWeight: '600',
  },
  subjectName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  subjectGrade: {
    fontStyle: 'italic',
  },
  gradeDistributionText: {
    marginTop: 8,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
