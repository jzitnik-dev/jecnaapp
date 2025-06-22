import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type {
  AccountInfo,
  SubjectGrades,
  Timetable,
} from '../api/SpseJecnaClient';
import { useSpseJecnaClient } from './useSpseJecnaClient';

// Cache keys
const GRADES_CACHE_KEY = 'dashboard_grades';
const GRADES_TIMESTAMP_KEY = 'dashboard_grades_timestamp';
const TIMETABLE_CACHE_KEY = 'dashboard_timetable';
const TIMETABLE_TIMESTAMP_KEY = 'dashboard_timetable_timestamp';
const ACCOUNT_CACHE_KEY = 'dashboard_account';
const ACCOUNT_TIMESTAMP_KEY = 'dashboard_account_timestamp';

// Cache duration (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

interface DashboardData {
  grades: SubjectGrades[];
  timetable: Timetable | null;
  accountInfo: AccountInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const { client } = useSpseJecnaClient();
  const [grades, setGrades] = useState<SubjectGrades[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = async <T>(
    cacheKey: string,
    timestampKey: string
  ): Promise<T | null> => {
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      const timestamp = await AsyncStorage.getItem(timestampKey);

      if (cachedData && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < CACHE_DURATION) {
          return JSON.parse(cachedData);
        }
      }
    } catch (err) {
      console.warn('Failed to load from cache:', err);
    }
    return null;
  };

  const saveToCache = async <T>(
    data: T,
    cacheKey: string,
    timestampKey: string
  ) => {
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      await AsyncStorage.setItem(timestampKey, Date.now().toString());
    } catch (err) {
      console.warn('Failed to save to cache:', err);
    }
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.multiRemove([
        GRADES_CACHE_KEY,
        GRADES_TIMESTAMP_KEY,
        TIMETABLE_CACHE_KEY,
        TIMETABLE_TIMESTAMP_KEY,
        ACCOUNT_CACHE_KEY,
        ACCOUNT_TIMESTAMP_KEY,
      ]);
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }
  };

  const fetchGrades = async (): Promise<SubjectGrades[]> => {
    if (!client) throw new Error('Client not available');

    // Check if logged in
    const isLoggedIn = await client.isLoggedIn();
    if (!isLoggedIn) throw new Error('Not logged in');

    return await client.getZnamky();
  };

  const fetchTimetable = async (): Promise<Timetable> => {
    if (!client) throw new Error('Client not available');

    // Check if logged in
    const isLoggedIn = await client.isLoggedIn();
    if (!isLoggedIn) throw new Error('Not logged in');

    return await client.getTimetable();
  };

  const fetchAccountInfo = async (): Promise<AccountInfo> => {
    if (!client) throw new Error('Client not available');

    // Check if logged in
    const isLoggedIn = await client.isLoggedIn();
    if (!isLoggedIn) throw new Error('Not logged in');

    return await client.getAccountInfo();
  };

  const loadDashboardData = async (forceRefresh = false) => {
    if (!client) {
      setError('Client not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if logged in first
      const isLoggedIn = await client.isLoggedIn();
      if (!isLoggedIn) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // Load grades
      let gradesData = forceRefresh
        ? null
        : await loadFromCache<SubjectGrades[]>(
            GRADES_CACHE_KEY,
            GRADES_TIMESTAMP_KEY
          );
      if (!gradesData) {
        try {
          gradesData = await fetchGrades();
          await saveToCache(gradesData, GRADES_CACHE_KEY, GRADES_TIMESTAMP_KEY);
        } catch (err) {
          console.warn('Failed to fetch grades:', err);
          gradesData = [];
        }
      }
      setGrades(gradesData);

      // Load timetable
      let timetableData = forceRefresh
        ? null
        : await loadFromCache<Timetable>(
            TIMETABLE_CACHE_KEY,
            TIMETABLE_TIMESTAMP_KEY
          );
      if (!timetableData) {
        try {
          timetableData = await fetchTimetable();
          await saveToCache(
            timetableData,
            TIMETABLE_CACHE_KEY,
            TIMETABLE_TIMESTAMP_KEY
          );
        } catch (err) {
          console.warn('Failed to fetch timetable:', err);
          timetableData = null;
        }
      }
      setTimetable(timetableData);

      // Load account info
      let accountData = forceRefresh
        ? null
        : await loadFromCache<AccountInfo>(
            ACCOUNT_CACHE_KEY,
            ACCOUNT_TIMESTAMP_KEY
          );
      if (!accountData) {
        try {
          accountData = await fetchAccountInfo();
          await saveToCache(
            accountData,
            ACCOUNT_CACHE_KEY,
            ACCOUNT_TIMESTAMP_KEY
          );
        } catch (err) {
          console.warn('Failed to fetch account info:', err);
          accountData = null;
        }
      }
      setAccountInfo(accountData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadDashboardData(true);

  useEffect(() => {
    if (client) {
      loadDashboardData();
    } else {
      // Clear data when client is null (logout)
      setGrades([]);
      setTimetable(null);
      setAccountInfo(null);
      setError(null);
      // Also clear cache on logout
      clearCache();
    }
  }, [client]);

  return {
    grades,
    timetable,
    accountInfo,
    loading,
    error,
    refresh,
  };
}
