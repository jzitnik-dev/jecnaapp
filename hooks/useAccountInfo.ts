import * as SecureStore from 'expo-secure-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { StudentProfile } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import { JecnaAPI, parseJson } from '@jzitnik/jecnaapi-react-native';

const ACCOUNT_INFO_KEY = 'account_info';
const ACCOUNT_INFO_TIMESTAMP_KEY = 'account_info_timestamp';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function loadFromCache(): Promise<StudentProfile | null> {
  try {
    const cachedData = await SecureStore.getItemAsync(ACCOUNT_INFO_KEY);
    const timestampStr = await SecureStore.getItemAsync(
      ACCOUNT_INFO_TIMESTAMP_KEY
    );

    if (cachedData && timestampStr) {
      const age = Date.now() - parseInt(timestampStr, 10);
      if (age < CACHE_DURATION) {
        return parseJson(cachedData);
      }
    }
  } catch (err) {
    console.warn('Failed to load account info from cache:', err);
  }
  return null;
}

async function saveToCache(data: StudentProfile) {
  try {
    await SecureStore.setItemAsync(ACCOUNT_INFO_KEY, JSON.stringify(data));
    await SecureStore.setItemAsync(
      ACCOUNT_INFO_TIMESTAMP_KEY,
      Date.now().toString()
    );
  } catch (err) {
    console.warn('Failed to save account info to cache:', err);
  }
}

async function clearCache() {
  try {
    await SecureStore.deleteItemAsync(ACCOUNT_INFO_KEY);
    await SecureStore.deleteItemAsync(ACCOUNT_INFO_TIMESTAMP_KEY);
  } catch (err) {
    console.warn('Failed to clear account info cache:', err);
  }
}

export function useAccountInfo() {
  const queryClient = useQueryClient();

  const fetchAccountInfo = async () => {
    const data = await JecnaAPI.getStudentProfile();
    await saveToCache(data);
    return data;
  };

  useEffect(() => {
    loadFromCache().then(cachedData => {
      if (cachedData) {
        queryClient.setQueryData(['accountInfo'], cachedData);
      }
    });
  }, [queryClient]);

  const query = useQuery<StudentProfile, Error>({
    queryKey: ['accountInfo'],
    queryFn: fetchAccountInfo,
    staleTime: CACHE_DURATION,
    refetchOnWindowFocus: false,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['accountInfo'] });
  };

  return {
    accountInfo: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh,
    clearCache,
  };
}
