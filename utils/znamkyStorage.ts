import { getItem, setItem } from './secureStore';

const SELECTED_YEAR_KEY = 'selected_znamky_year';
const SELECTED_PERIOD_KEY = 'selected_znamky_period';

export async function saveZnamkySelections(year?: string, period?: string) {
  if (year) await setItem(SELECTED_YEAR_KEY, year);
  if (period) await setItem(SELECTED_PERIOD_KEY, period);
}

export async function getZnamkySelections(): Promise<{
  year?: string;
  period?: string;
}> {
  const [year, period] = await Promise.all([
    getItem(SELECTED_YEAR_KEY),
    getItem(SELECTED_PERIOD_KEY),
  ]);
  return { year: year || undefined, period: period || undefined };
}
