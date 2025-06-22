import type { SubjectGrades, Timetable } from '../api/SpseJecnaClient';

export interface GradeStats {
  average: number;
  totalGrades: number;
  gradeDistribution: { [key: number]: number };
  subjectsWithGrades: number;
  bestSubject: { subject: string; average: number };
  worstSubject: { subject: string; average: number };
}

export interface TimetableStats {
  totalLessons: number;
  lessonsByDay: { [key: string]: number };
  lessonsBySubject: { [key: string]: number };
  mostCommonSubject: string;
  busiestDay: string;
  freePeriods: number;
}

export interface DashboardStats {
  gradeStats: GradeStats;
  timetableStats: TimetableStats;
  nextLesson?: {
    subject: string;
    teacher: string;
    room: string;
    time: string;
    day: string;
  };
}

export interface LessonInfo {
  subject: string;
  teacher: string;
  teacherFull: string;
  teacherCode: string;
  room: string;
  time: string;
  day: string;
  startTime: string;
  endTime: string;
  period: number;
  isCurrent: boolean;
  isNext: boolean;
  timeUntilStart?: string;
  timeUntilEnd?: string;
}

export function calculateGradeStats(grades: SubjectGrades[]): GradeStats {
  if (!grades || grades.length === 0) {
    return {
      average: 0,
      totalGrades: 0,
      gradeDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      subjectsWithGrades: 0,
      bestSubject: { subject: 'Žádné', average: 0 },
      worstSubject: { subject: 'Žádné', average: 0 },
    };
  }

  const gradeDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const subjectAverages: { [key: string]: number[] } = {};
  let totalWeightedSum = 0;
  let totalWeight = 0;
  let totalGrades = 0;

  try {
    for (const subject of grades) {
      if (!subject || !subject.splits) continue;
      
      const subjectGrades: number[] = [];
      
      for (const split of subject.splits) {
        if (!split || !split.grades) continue;
        
        for (const grade of split.grades) {
          if (!grade) continue;
          
          if (typeof grade.value === 'number' && grade.value >= 1 && grade.value <= 5) {
            gradeDistribution[grade.value]++;
            totalGrades++;
            totalWeightedSum += grade.value * (grade.weight || 1);
            totalWeight += (grade.weight || 1);
            subjectGrades.push(grade.value);
          }
        }
      }
      
      if (subjectGrades.length > 0 && subject.subject) {
        subjectAverages[subject.subject] = subjectGrades;
      }
    }
  } catch (error) {
    console.warn('Error calculating grade stats:', error);
  }

  const average = totalWeight > 0 ? totalWeightedSum / totalWeight : 0;
  const subjectsWithGrades = Object.keys(subjectAverages).length;

  // Find best and worst subjects
  let bestSubject = { subject: 'Žádné', average: 0 };
  let worstSubject = { subject: 'Žádné', average: 0 };

  try {
    for (const [subject, grades] of Object.entries(subjectAverages)) {
      const avg = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
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

export function calculateTimetableStats(timetable: Timetable): TimetableStats {
  if (!timetable || !timetable.days) {
    return {
      totalLessons: 0,
      lessonsByDay: {},
      lessonsBySubject: {},
      mostCommonSubject: 'Žádný',
      busiestDay: 'Žádný',
      freePeriods: 0,
    };
  }

  const lessonsByDay: { [key: string]: number } = {};
  const lessonsBySubject: { [key: string]: number } = {};
  let totalLessons = 0;
  let freePeriods = 0;

  try {
    for (const day of timetable.days) {
      if (!day || !day.cells) continue;
      
      let dayLessons = 0;
      
      for (const cell of day.cells) {
        if (cell && cell.length > 0) {
          dayLessons += cell.length;
          totalLessons += cell.length;
          
          for (const lesson of cell) {
            if (lesson && lesson.subject) {
              const subject = lesson.subject;
              lessonsBySubject[subject] = (lessonsBySubject[subject] || 0) + 1;
            }
          }
        } else {
          freePeriods++;
        }
      }
      
      if (day.day) {
        lessonsByDay[day.day] = dayLessons;
      }
    }
  } catch (error) {
    console.warn('Error calculating timetable stats:', error);
  }

  // Find most common subject
  let mostCommonSubject = 'Žádný';
  let maxCount = 0;
  try {
    for (const [subject, count] of Object.entries(lessonsBySubject)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonSubject = subject;
      }
    }
  } catch (error) {
    console.warn('Error finding most common subject:', error);
  }

  // Find busiest day
  let busiestDay = 'Žádný';
  let maxLessons = 0;
  try {
    for (const [day, lessons] of Object.entries(lessonsByDay)) {
      if (lessons > maxLessons) {
        maxLessons = lessons;
        busiestDay = day;
      }
    }
  } catch (error) {
    console.warn('Error finding busiest day:', error);
  }

  return {
    totalLessons,
    lessonsByDay,
    lessonsBySubject,
    mostCommonSubject,
    busiestDay,
    freePeriods,
  };
}

export function getCurrentAndNextLesson(timetable: Timetable): {
  currentLesson?: LessonInfo;
  nextLesson?: LessonInfo;
} {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
  
  // Map day numbers to timetable days (assuming Monday = 1, etc.)
  const dayMap = ['', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  const currentDayName = dayMap[currentDay];
  
  // Find today's lessons
  const today = timetable.days.find(d => d.day === currentDayName);
  if (!today) return {};
  
  let currentLesson: LessonInfo | undefined;
  let nextLesson: LessonInfo | undefined;
  
  // Check each period
  for (let i = 0; i < today.cells.length; i++) {
    const cell = today.cells[i];
    const period = timetable.periods[i];
    
    if (!cell || cell.length === 0 || !period) continue;
    
    const lesson = cell[0]; // Take first lesson if multiple
    const [startTime, endTime] = period.time.split(' - ');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    
    const lessonInfo: LessonInfo = {
      subject: lesson.subject,
      teacher: lesson.teacher,
      teacherFull: lesson.teacherFull || lesson.teacher,
      teacherCode: lesson.teacher,
      room: lesson.room,
      time: period.time,
      day: today.day,
      startTime,
      endTime,
      period: period.number,
      isCurrent: false,
      isNext: false,
    };
    
    // Check if this is the current lesson
    if (currentTime >= startTimeMinutes && currentTime < endTimeMinutes) {
      lessonInfo.isCurrent = true;
      const timeUntilEnd = endTimeMinutes - currentTime;
      const hoursLeft = Math.floor(timeUntilEnd / 60);
      const minutesLeft = timeUntilEnd % 60;
      
      if (hoursLeft > 0) {
        lessonInfo.timeUntilEnd = `${hoursLeft}h ${minutesLeft}m`;
      } else {
        lessonInfo.timeUntilEnd = `${minutesLeft}m`;
      }
      
      currentLesson = lessonInfo;
    }
    // Check if this is the next lesson
    else if (currentTime < startTimeMinutes && !nextLesson) {
      lessonInfo.isNext = true;
      const timeUntilStart = startTimeMinutes - currentTime;
      const hoursLeft = Math.floor(timeUntilStart / 60);
      const minutesLeft = timeUntilStart % 60;
      
      if (hoursLeft > 0) {
        lessonInfo.timeUntilStart = `${hoursLeft}h ${minutesLeft}m`;
      } else {
        lessonInfo.timeUntilStart = `${minutesLeft}m`;
      }
      
      nextLesson = lessonInfo;
    }
  }
  
  return { currentLesson, nextLesson };
}

export function getNextLesson(timetable: Timetable): {
  subject: string;
  teacher: string;
  room: string;
  time: string;
  day: string;
} | undefined {
  const { nextLesson } = getCurrentAndNextLesson(timetable);
  if (!nextLesson) return undefined;
  
  return {
    subject: nextLesson.subject,
    teacher: nextLesson.teacher,
    room: nextLesson.room,
    time: nextLesson.time,
    day: nextLesson.day,
  };
}

export function getGradeChartData(gradeStats: GradeStats) {
  return {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [{
      data: [
        gradeStats.gradeDistribution[1] || 0,
        gradeStats.gradeDistribution[2] || 0,
        gradeStats.gradeDistribution[3] || 0,
        gradeStats.gradeDistribution[4] || 0,
        gradeStats.gradeDistribution[5] || 0,
      ],
    }],
  };
}

export function getTimetableChartData(timetableStats: TimetableStats) {
  const dayOrder = ['Po', 'Út', 'St', 'Čt', 'Pá'];
  return {
    labels: dayOrder,
    datasets: [{
      data: dayOrder.map(day => timetableStats.lessonsByDay[day] || 0),
    }],
  };
}

export function getGradeTrendChartData(grades: SubjectGrades[]) {
  // Collect all grades with dates
  const allGrades: Array<{ value: number; date: string; weight: number }> = [];
  
  for (const subject of grades) {
    if (!subject || !subject.splits) continue;
    
    for (const split of subject.splits) {
      if (!split || !split.grades) continue;
      
      for (const grade of split.grades) {
        if (!grade || typeof grade.value !== 'number' || grade.value < 1 || grade.value > 5) continue;
        if (!grade.date) continue;
        
        allGrades.push({
          value: grade.value,
          date: grade.date,
          weight: grade.weight || 1,
        });
      }
    }
  }
  
  console.log('All grades with dates:', allGrades.length);
  
  if (allGrades.length === 0) {
    // Return fallback data to prevent chart error
    return {
      labels: ['Žádná data'],
      datasets: [{
        data: [0],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  }
  
  // Sort by date
  allGrades.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Group by months
  const monthlyAverages: { [monthKey: string]: { total: number; weight: number; count: number } } = {};
  
  for (const grade of allGrades) {
    const date = parseDate(grade.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthlyAverages[monthKey]) {
      monthlyAverages[monthKey] = { total: 0, weight: 0, count: 0 };
    }
    
    monthlyAverages[monthKey].total += grade.value * grade.weight;
    monthlyAverages[monthKey].weight += grade.weight;
    monthlyAverages[monthKey].count += 1;
  }
  
  console.log('Monthly averages:', monthlyAverages);
  
  // Convert to chart data and filter out months with no grades
  const chartData = Object.entries(monthlyAverages)
    .filter(([_, data]) => data.count > 0)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
      const monthIndex = parseInt(month) - 1;
      
      // Ensure monthIndex is valid
      if (monthIndex < 0 || monthIndex >= monthNames.length) {
        console.warn('Invalid month index:', monthIndex, 'for monthKey:', monthKey);
        return null;
      }
      
      return {
        label: monthNames[monthIndex],
        average: data.weight > 0 ? data.total / data.weight : 0,
      };
    })
    .filter(item => item !== null && item.average > 0);
  
  console.log('Chart data:', chartData);
  
  // If no valid data, return fallback
  if (chartData.length === 0) {
    return {
      labels: ['Žádná data'],
      datasets: [{
        data: [0],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  }
  
  const result = {
    labels: chartData.map(item => item!.label),
    datasets: [{
      data: chartData.map(item => item!.average),
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      strokeWidth: 2,
    }],
  };
  
  console.log('Final result:', result);
  return result;
}

// Helper function to parse DD.MM.YYYY format
function parseDate(dateString: string): Date {
  const [day, month, year] = dateString.split('.').map(Number);
  return new Date(year, month - 1, day); // month - 1 because Date constructor uses 0-based months
} 