import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useJecnaRozvrhClient } from './useJecnaRozvrhClient';
import { useAccountInfo } from './useAccountInfo';
import { GradesPage } from 'jecnaapi-react-native/jecnaapi';
import { Canteen, JecnaAPI } from 'jecnaapi-react-native';

export function useDashboardData() {
  const { client: extraordClient } = useJecnaRozvrhClient();
  const queryClient = useQueryClient();
  const { accountInfo } = useAccountInfo();

  // ---------------------- Grades ----------------------
  const gradesQuery = useQuery<GradesPage, Error>({
    queryKey: ['grades'],
    queryFn: async () => {
      return await JecnaAPI.getGradesPage();
    },
    staleTime: 3 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ---------------------- Timetable ----------------------
  const timetableQuery = useQuery({
    queryKey: ['timetable'],
    queryFn: async () => {
      return await JecnaAPI.getTimetablePage();
    },
    staleTime: 30 * 60 * 1000,
  });

  const extraordinary = useQuery({
    queryKey: ['extraordinarytimetable', accountInfo?.className],
    queryFn: async () => {
      const res = await extraordClient?.getSchedule(
        accountInfo?.className || ''
      );
      return res;
    },
    enabled: !!extraordClient && !!accountInfo,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // ---------------------- Account Info ----------------------
  const accountInfoQuery = useQuery({
    queryKey: ['accountInfo'],
    queryFn: async () => {
      return await JecnaAPI.getStudentProfile();
    },
    staleTime: 3 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ---------------------- Locker ----------------------
  const lockerQuery = useQuery({
    queryKey: ['locker'],
    queryFn: async () => {
      return await JecnaAPI.getLocker();
    },
    staleTime: 3 * 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 3,
  });

  // ---------------------- Canteen Menu ----------------------
  const canteenMenuQuery = useQuery({
    queryKey: ['canteenMenu'],
    queryFn: async () => {
      return await Canteen.getMenuPage();
    },
    staleTime: 10 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 0,
  });

  // ---------------------- Absences ----------------------
  const absenceQuery = useQuery({
    queryKey: ['absences'],
    queryFn: async () => {
      return JecnaAPI.getAbsencesPage();
    },
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
    grades: gradesQuery.data ?? null,
    timetable: timetableQuery.data ?? null,
    accountInfo: accountInfoQuery.data ?? null,
    locker: lockerQuery.data ?? null,
    canteen: canteenMenuQuery.data ?? null,
    absences: absenceQuery.data ?? null,
    extraord: extraordinary.data ?? null,
    loading:
      gradesQuery.isFetching ||
      timetableQuery.isFetching ||
      accountInfoQuery.isFetching ||
      lockerQuery.isFetching ||
      canteenMenuQuery.isFetching ||
      absenceQuery.isFetching ||
      extraordinary.isFetching,
    error:
      gradesQuery.error?.message ??
      timetableQuery.error?.message ??
      accountInfoQuery.error?.message ??
      lockerQuery.error?.message ??
      canteenMenuQuery.error?.message ??
      absenceQuery.error?.message ??
      extraordinary.isFetching ??
      null,
    refresh,
  };
}
