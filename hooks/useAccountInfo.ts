import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import type { AccountInfo } from '../api/SpseJecnaClient';
import { useSpseJecnaClient } from './useSpseJecnaClient';

const ACCOUNT_INFO_KEY = 'account_info';
const ACCOUNT_INFO_TIMESTAMP_KEY = 'account_info_timestamp';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useAccountInfo() {
  const { client } = useSpseJecnaClient();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = async (): Promise<AccountInfo | null> => {
    try {
      const cachedData = await SecureStore.getItemAsync(ACCOUNT_INFO_KEY);
      const timestamp = await SecureStore.getItemAsync(
        ACCOUNT_INFO_TIMESTAMP_KEY
      );

      if (cachedData && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < CACHE_DURATION) {
          return JSON.parse(cachedData);
        }
      }
    } catch (err) {
      console.warn('Failed to load account info from cache:', err);
    }
    return null;
  };

  const saveToCache = async (data: AccountInfo) => {
    try {
      await SecureStore.setItemAsync(ACCOUNT_INFO_KEY, JSON.stringify(data));
      await SecureStore.setItemAsync(
        ACCOUNT_INFO_TIMESTAMP_KEY,
        Date.now().toString()
      );
    } catch (err) {
      console.warn('Failed to save account info to cache:', err);
    }
  };

  const clearCache = async () => {
    try {
      await SecureStore.deleteItemAsync(ACCOUNT_INFO_KEY);
      await SecureStore.deleteItemAsync(ACCOUNT_INFO_TIMESTAMP_KEY);
    } catch (err) {
      console.warn('Failed to clear account info cache:', err);
    }
  };

  const fetchAccountInfo = async (forceRefresh = false) => {
    if (!client) {
      setError('Client not available');
      return;
    }

    // Check if client is actually logged in before attempting to fetch account info
    try {
      const isLoggedIn = await client.isLoggedIn();
      if (!isLoggedIn) {
        setError('Not logged in');
        setAccountInfo(null);
        return;
      }
    } catch (err) {
      setError('Failed to check login status');
      setAccountInfo(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = await loadFromCache();
        if (cached) {
          setAccountInfo(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data
      const freshData = await client.getAccountInfo();
      setAccountInfo(freshData);
      await saveToCache(freshData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch account info';
      setError(errorMessage);
      console.error('Error fetching account info:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => fetchAccountInfo(true);

  useEffect(() => {
    if (client) {
      fetchAccountInfo();
    } else {
      // Clear account info when client is null (logout)
      setAccountInfo(null);
      setError(null);
    }
  }, [client]);

  return {
    accountInfo,
    loading,
    error,
    refresh,
    clearCache,
  };
}
