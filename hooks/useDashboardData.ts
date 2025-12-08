import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AccountInfo,
  LockerData,
  OmluvnyListResult,
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

  const isLoggedIn = async () => {
    if (!client) return false;
    return await client.isLoggedIn();
  };

  // ---------------------- Grades ----------------------
  const gradesQuery = useQuery<SubjectGrades[], Error>({
    queryKey: ['grades'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');

      const selections = await getZnamkySelections();
      if (selections?.year || selections?.period) {
        return client.getZnamky(selections.year, selections.period);
      }
      return client.getZnamky();
    },
    enabled: !!client,
    staleTime: 3 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ---------------------- Timetable ----------------------
  const timetableQuery = useQuery<Timetable | null, Error>({
    queryKey: ['timetable'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');

      const selections = await getTimetableSelections();
      if (selections?.year || selections?.period) {
        return client.getTimetable(selections.year, selections.period);
      }
      return client.getTimetable();
    },
    enabled: !!client,
    staleTime: 30 * 60 * 1000,
  });

  // ---------------------- Account Info ----------------------
  const accountInfoQuery = useQuery<AccountInfo | null, Error>({
    queryKey: ['accountInfo'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      return client.getAccountInfo();
    },
    enabled: !!client,
    staleTime: 3 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ---------------------- Locker ----------------------
  const lockerQuery = useQuery<LockerData | null, Error>({
    queryKey: ['locker'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      return client.getLocker();
    },
    enabled: !!client,
    staleTime: 3 * 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ---------------------- Canteen Menu ----------------------
  const canteenMenuQuery = useQuery<CanteenMenuResult, Error>({
    queryKey: ['canteenMenu'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      const canteenClient = await withTimeout(client.getCanteenClient(), 25000);
      return withTimeout(canteenClient.getMonthlyMenu(), 25000);
    },
    enabled: !!client,
    staleTime: 10 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0,
  });

  // ---------------------- Absences ----------------------
  const absenceQuery = useQuery<OmluvnyListResult | null, Error>({
    queryKey: ['absences'],
    queryFn: async () => {
      if (!(await isLoggedIn())) throw new Error('Not logged in');
      if (!client) throw new Error('Client not available');
      return client.getOmluvnyList();
    },
    enabled: !!client,
    staleTime: 5 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ---------------------- Refresh ----------------------
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['grades'] });
    await queryClient.invalidateQueries({ queryKey: ['timetable'] });
    await queryClient.invalidateQueries({ queryKey: ['accountInfo'] });
    await queryClient.invalidateQueries({ queryKey: ['locker'] });
    await queryClient.invalidateQueries({ queryKey: ['absences'] });
    await queryClient.invalidateQueries({ queryKey: ['canteenMenu'] });
  };

  return {
    grades: gradesQuery.data ?? [],
    timetable: timetableQuery.data ?? null,
    accountInfo: accountInfoQuery.data ?? null,
    locker: lockerQuery.data ?? null,
    canteen: canteenMenuQuery.data ?? null,
    absences: absenceQuery.data ?? null,
    loading:
      gradesQuery.isFetching ||
      timetableQuery.isFetching ||
      accountInfoQuery.isFetching ||
      lockerQuery.isFetching ||
      canteenMenuQuery.isFetching ||
      absenceQuery.isFetching,
    error:
      gradesQuery.error?.message ??
      timetableQuery.error?.message ??
      accountInfoQuery.error?.message ??
      lockerQuery.error?.message ??
      canteenMenuQuery.error?.message ??
      absenceQuery.error?.message ??
      null,
    refresh,
  };
}
