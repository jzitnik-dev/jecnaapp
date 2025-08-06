import * as SecureStore from 'expo-secure-store';

const SELECTED_YEAR_KEY = 'selected_timetable_year';
const SELECTED_PERIOD_KEY = 'selected_timetable_period';

export async function saveTimetableSelections(year?: string, period?: string) {
  if (year) await SecureStore.setItemAsync(SELECTED_YEAR_KEY, year);
  if (period) await SecureStore.setItemAsync(SELECTED_PERIOD_KEY, period);
}

export async function getTimetableSelections(): Promise<{
  year?: string;
  period?: string;
}> {
  const [year, period] = await Promise.all([
    SecureStore.getItemAsync(SELECTED_YEAR_KEY),
    SecureStore.getItemAsync(SELECTED_PERIOD_KEY),
  ]);
  return { year: year || undefined, period: period || undefined };
}
