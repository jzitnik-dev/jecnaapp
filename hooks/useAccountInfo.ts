import * as SecureStore from 'expo-secure-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { AccountInfo } from '../api/SpseJecnaClient';
import { useSpseJecnaClient } from './useSpseJecnaClient';

const ACCOUNT_INFO_KEY = 'account_info';
const ACCOUNT_INFO_TIMESTAMP_KEY = 'account_info_timestamp';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

async function loadFromCache(): Promise<AccountInfo | null> {
  try {
    const cachedData = await SecureStore.getItemAsync(ACCOUNT_INFO_KEY);
    const timestampStr = await SecureStore.getItemAsync(
      ACCOUNT_INFO_TIMESTAMP_KEY
    );

    if (cachedData && timestampStr) {
      const age = Date.now() - parseInt(timestampStr, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cachedData);
      }
    }
  } catch (err) {
    console.warn('Failed to load account info from cache:', err);
  }
  return null;
}

async function saveToCache(data: AccountInfo) {
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
  const { client } = useSpseJecnaClient();
  const queryClient = useQueryClient();

  // This function fetches fresh data from the client
  const fetchAccountInfo = async (): Promise<AccountInfo> => {
    if (!client) throw new Error('Client not available');
    const isLoggedIn = await client.isLoggedIn();
    if (!isLoggedIn) throw new Error('Not logged in');
    const data = await client.getAccountInfo();
    await saveToCache(data); // Save fresh data to SecureStore
    return data;
  };

  // Load cached data from SecureStore once on mount
  // We use this to initialize query data without refetching if valid cache exists
  // We update the React Query cache with the SecureStore data
  useEffect(() => {
    if (!client) {
      queryClient.removeQueries({ queryKey: ['accountInfo'] });
      return;
    }
    loadFromCache().then(cachedData => {
      if (cachedData) {
        queryClient.setQueryData(['accountInfo'], cachedData);
      }
    });
  }, [client, queryClient]);

  const query = useQuery<AccountInfo, Error>({
    queryKey: ['accountInfo'],
    queryFn: fetchAccountInfo,
    enabled: !!client,
    staleTime: CACHE_DURATION, // mark data fresh for 15 mins
    refetchOnWindowFocus: false,
  });

  // Manual refresh method invalidates & refetches the query
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['accountInfo'] });
    // queryClient.refetchQueries({ queryKey: ['accountInfo'] }); // alternatively
  };

  return {
    accountInfo: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh,
    clearCache,
  };
}
