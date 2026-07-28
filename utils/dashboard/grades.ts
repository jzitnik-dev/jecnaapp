import { GradesPage } from 'jecnaapi-react-native/jecnaapi';

export interface GradeStats {
  average: number;
  totalGrades: number;
  gradeDistribution: { [key: number]: number };
  subjectsWithGrades: number;
  bestSubject: { subject: string; average: number };
  worstSubject: { subject: string; average: number };
}

export function calculateGradeStats(
  page?: GradesPage | null
): GradeStats | undefined {
  if (!page) {
    return;
  }

  const defaultStats = {
    average: 0,
    totalGrades: 0,
    gradeDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    subjectsWithGrades: 0,
    bestSubject: { subject: 'Žádné', average: 0 },
    worstSubject: { subject: 'Žádné', average: 0 },
  };

  if (
    !page ||
    !page.subjectsMap ||
    Object.keys(page.subjectsMap).length === 0
  ) {
    return defaultStats;
  }

  const gradeDistribution: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const subjectAverages: {
    [key: string]: { value: number; weight: number }[];
  } = {};

  let totalWeightedSum = 0;
  let totalWeight = 0;
  let totalGrades = 0;

  try {
    for (const [subjectName, subjectData] of Object.entries(page.subjectsMap)) {
      if (
        !subjectData ||
        !subjectData.grades ||
        !subjectData.grades.subjectPartsGrades
      )
        continue;

      const subjectGrades: { value: number; weight: number }[] = [];

      for (const gradesArray of Object.values(
        subjectData.grades.subjectPartsGrades
      )) {
        if (!gradesArray || !Array.isArray(gradesArray)) continue;

        for (const grade of gradesArray) {
          if (!grade) continue;

          if (
            typeof grade.value === 'number' &&
            grade.value >= 1 &&
            grade.value <= 5
          ) {
            const weight = grade.small ? 0.5 : 1;

            gradeDistribution[grade.value]++;
            totalGrades++;
            totalWeightedSum += grade.value * weight;
            totalWeight += weight;

            subjectGrades.push({ value: grade.value, weight });
          }
        }
      }

      if (subjectGrades.length > 0) {
        subjectAverages[subjectName] = subjectGrades;
      }
    }
  } catch (error) {
    console.warn('Error calculating grade stats:', error);
  }

  const average = totalWeight > 0 ? totalWeightedSum / totalWeight : 0;
  const subjectsWithGrades = Object.keys(subjectAverages).length;

  let bestSubject = { subject: 'Žádné', average: 0 };
  let worstSubject = { subject: 'Žádné', average: 0 };

  try {
    for (const [subject, grades] of Object.entries(subjectAverages)) {
      const totalW = grades.reduce((sum, g) => sum + g.weight, 0);
      const avg =
        totalW > 0
          ? grades.reduce((sum, g) => sum + g.value * g.weight, 0) / totalW
          : 0;

      if (bestSubject.average === 0 || avg < bestSubject.average) {
        bestSubject = { subject, average: avg };
      }
      if (worstSubject.average === 0 || avg > worstSubject.average) {
        worstSubject = { subject, average: avg };
      }
    }
  } catch (error) {
    console.warn('Error finding best/worst subjects:', error);
  }

  return {
    average: Math.round(average * 100) / 100,
    totalGrades,
    gradeDistribution,
    subjectsWithGrades,
    bestSubject,
    worstSubject,
  };
}

export function getGradeChartData(gradeStats?: GradeStats) {
  if (!gradeStats) {
    return;
  }

  return {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [
      {
        data: [
          gradeStats.gradeDistribution[1] || 0,
          gradeStats.gradeDistribution[2] || 0,
          gradeStats.gradeDistribution[3] || 0,
          gradeStats.gradeDistribution[4] || 0,
          gradeStats.gradeDistribution[5] || 0,
        ],
      },
    ],
  };
}

export function getGradeTrendChartData(page?: GradesPage | null) {
  if (!page) {
    return;
  }

  const allGrades: { value: number; date: Date; weight: number }[] = [];

  if (page && page.subjectsMap) {
    for (const subjectData of Object.values(page.subjectsMap)) {
      if (
        !subjectData ||
        !subjectData.grades ||
        !subjectData.grades.subjectPartsGrades
      )
        continue;

      for (const gradesArray of Object.values(
        subjectData.grades.subjectPartsGrades
      )) {
        if (!gradesArray || !Array.isArray(gradesArray)) continue;

        for (const grade of gradesArray) {
          if (
            !grade ||
            typeof grade.value !== 'number' ||
            grade.value < 1 ||
            grade.value > 5
          ) {
            continue;
          }

          const dateRaw = grade.receiveDate;

          if (!dateRaw) continue;

          const dateObj = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);

          if (isNaN(dateObj.getTime())) continue;

          allGrades.push({
            value: grade.value,
            date: dateObj,
            weight: grade.small ? 0.5 : 1,
          });
        }
      }
    }
  }

  if (allGrades.length === 0) {
    return {
      labels: ['Žádná data'],
      datasets: [
        {
          data: [0],
          strokeWidth: 2,
        },
      ],
    };
  }

  allGrades.sort((a, b) => a.date.getTime() - b.date.getTime());

  const monthlyAverages: {
    [monthKey: string]: { total: number; weight: number; count: number };
  } = {};

  for (const grade of allGrades) {
    const monthKey = `${grade.date.getFullYear()}-${grade.date.getMonth() + 1}`;

    if (!monthlyAverages[monthKey]) {
      monthlyAverages[monthKey] = { total: 0, weight: 0, count: 0 };
    }

    monthlyAverages[monthKey].total += grade.value * grade.weight;
    monthlyAverages[monthKey].weight += grade.weight;
    monthlyAverages[monthKey].count += 1;
  }

  const chartData = Object.entries(monthlyAverages)
    .filter(([_, data]) => data.count > 0)
    .map(([monthKey, data]) => {
      const [, month] = monthKey.split('-');
      const monthNames = [
        'Led',
        'Úno',
        'Bře',
        'Dub',
        'Kvě',
        'Čer',
        'Čvc',
        'Srp',
        'Zář',
        'Říj',
        'Lis',
        'Pro',
      ];
      const monthIndex = parseInt(month) - 1;

      if (monthIndex < 0 || monthIndex >= monthNames.length) {
        return null;
      }

      return {
        label: monthNames[monthIndex],
        average: data.weight > 0 ? data.total / data.weight : 0,
      };
    })
    .filter(item => item !== null && item.average > 0);

  if (chartData.length === 0) {
    return {
      labels: ['Žádná data'],
      datasets: [
        {
          data: [0],
          strokeWidth: 2,
        },
      ],
    };
  }

  return {
    labels: chartData.map(item => item!.label),
    datasets: [
      {
        data: chartData.map(item => item!.average),
        strokeWidth: 2,
      },
    ],
  };
}
