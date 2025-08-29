import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,
      retryDelay: attemptIndex => Math.min(100 * 2 ** attemptIndex, 10000),
      staleTime: 10 * 60 * 1000, // 10 min
      refetchOnMount: 'always', // 👈 always refetch when mounted
      refetchOnReconnect: 'always', // 👈 always refetch when app regains connection
    },
  },
});

// Persist queries in AsyncStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 24 * 60 * 60 * 1000, // 24h
});
