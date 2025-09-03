import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type {
  AccountInfo,
  LockerData,
  SubjectGrades,
  Timetable,
} from '../api/SpseJecnaClient';
import { useSpseJecnaClient } from './useSpseJecnaClient';
import { getTimetableSelections } from '@/utils/timetableStorage';
import { getZnamkySelections } from '@/utils/znamkyStorage';
import { CanteenMenuResult } from '@/api/iCanteenClient';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function useDashboardData() {
  const { client } = useSpseJecnaClient();
  const queryClient = useQueryClient();

  const [savedSelections, setSavedSelections] = useState<{
    year?: string;
    period?: string;
  } | null>(null);

  const [savedSelectionsZnamky, setSavedSelectionsZnamky] = useState<{
    year?: string;
    period?: string;
  } | null>(null);

  // Load saved timetable selections once on mount
  useEffect(() => {
    (async () => {
      const selections = await getTimetableSelections();
      setSavedSelections(selections);

      const selectionsZnamky = await getZnamkySelections();
      setSavedSelectionsZnamky(selectionsZnamky);
    })();
  }, []);

  // Helper to check login status
  const isLoggedIn = async () => {
    if (!client) return false;
    return await client.isLoggedIn();
  };

  // Grades query
  const gradesQuery = useQuery<SubjectGrades[], Error>({
    queryKey: ['grades'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');

      if (savedSelectionsZnamky?.year || savedSelectionsZnamky?.period) {
        return client.getZnamky(
          savedSelectionsZnamky.year,
          savedSelectionsZnamky.period
        );
      }

      return client.getZnamky();
    },
    enabled: !!client,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Timetable query
  const timetableQuery = useQuery<Timetable | null, Error>({
    queryKey: ['timetable', savedSelections?.year, savedSelections?.period],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      // If we have saved selections, use them; else call without params
      if (savedSelections?.year || savedSelections?.period) {
        return client.getTimetable(
          savedSelections.year,
          savedSelections.period
        );
      }
      return client.getTimetable();
    },
    enabled: !!client && savedSelections !== null, // wait for saved selections to load
    staleTime: 30 * 60 * 1000,
  });

  // Account info query
  const accountInfoQuery = useQuery<AccountInfo | null, Error>({
    queryKey: ['accountInfo'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      return client.getAccountInfo();
    },
    enabled: !!client,
    staleTime: 30 * 60 * 1000,
  });

  const lockerQuery = useQuery<LockerData | null, Error>({
    queryKey: ['locker'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      return client.getLocker();
    },
    enabled: !!client,
    staleTime: 30 * 60 * 1000,
  });

  const canteenMenuQuery = useQuery<CanteenMenuResult, Error>({
    queryKey: ['canteenMenu'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      const canteenClient = await client.getCanteenClient();
      return withTimeout(canteenClient.getMonthlyMenu(), 25000);
    },
    enabled: !!client,
    staleTime: 10 * 60 * 60 * 1000, // 10 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0,
  });

  // Refresh all dashboard data
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['grades'] });
    await queryClient.invalidateQueries({ queryKey: ['timetable'] });
    await queryClient.invalidateQueries({ queryKey: ['accountInfo'] });
    await queryClient.invalidateQueries({ queryKey: ['lockerQuery'] });
  };

  return {
    grades: gradesQuery.data ?? [],
    timetable: timetableQuery.data ?? null,
    accountInfo: accountInfoQuery.data ?? null,
    locker: lockerQuery.data ?? null,
    canteen: canteenMenuQuery.data ?? null,
    loading:
      gradesQuery.isFetching ||
      timetableQuery.isFetching ||
      accountInfoQuery.isFetching ||
      lockerQuery.isFetching ||
      canteenMenuQuery.isFetching,
    error:
      gradesQuery.error?.message ??
      timetableQuery.error?.message ??
      accountInfoQuery.error?.message ??
      lockerQuery.error?.message ??
      canteenMenuQuery.error?.message ??
      null,
    refresh,
  };
}
