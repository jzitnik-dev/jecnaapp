import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = typeof window !== 'undefined';

// On web, use localStorage fallback
const storage = isWeb
  ? {
      getItem: async (key: string) => localStorage.getItem(key),
      setItem: async (key: string, value: string) =>
        localStorage.setItem(key, value),
      removeItem: async (key: string) => localStorage.removeItem(key),
    }
  : AsyncStorage;

// Create persister (works both web and native)
const persister = createAsyncStoragePersister({
  storage,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,
      retryDelay: attemptIndex => Math.min(100 * 2 ** attemptIndex, 10000),
      staleTime: 10 * 60 * 1000, // 10 min
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
    },
  },
});

// Only persist if window exists
if (isWeb || typeof window !== 'undefined') {
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24h
  });
}
