import { FinalGrade, Grade } from '@jzitnik/jecnaapi-react-native/jecnaapi';

export const gradeColor = (value: number): `#${string}` => {
  const colors: `#${string}`[] = [
    '#4CAF50', // 1
    '#8BC34A', // 2
    '#FFC107', // 3
    '#FF9800', // 4
    '#F44336', // 5
  ];
  const idx = Math.round(value) - 1;
  return colors[idx] || '#BDBDBD';
};

export const formatFinalGrade = (fg: FinalGrade): string => {
  switch (fg.type) {
    case 'Grade':
      return fg.value.toString();
    case 'GradesWarning':
      return 'N (5)';
    case 'AbsenceWarning':
      return 'N';
    case 'GradesAndAbsenceWarning':
      return 'N (5/Abs)';
    case 'Excused':
      return 'U';
    default:
      return '-';
  }
};

export const getWeightedAverage = (grades: Grade[]): number | null => {
  if (grades.length === 0) return null;
  let sum = 0;
  let weightSum = 0;
  for (const g of grades) {
    const weight = g.small ? 0.5 : 1;
    sum += g.value * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return null;
  return sum / weightSum;
};
