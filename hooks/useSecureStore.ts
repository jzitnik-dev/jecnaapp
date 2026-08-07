import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

interface UseSecureStoreOptions<T> {
  initialValue: T;
  parse?: (val: string) => T;
  stringify?: (val: T) => string;
}

export function useSecureStore<T>(
  key: string,
  options: UseSecureStoreOptions<T>
): [T, (newValue: T) => void, boolean] {
  const queryClient = useQueryClient();
  const { initialValue, parse, stringify } = options;
  const queryKey = ['secure-store', key];

  const { data, isLoading } = useQuery<T>({
    queryKey,
    queryFn: async (): Promise<T> => {
      const result = await SecureStore.getItemAsync(key);
      if (result === null) return initialValue;
      return parse ? parse(result) : (result as unknown as T);
    },
    staleTime: Infinity,
  });

  const { mutate: setValue } = useMutation({
    mutationFn: async (newValue: T) => {
      const stringValue = stringify ? stringify(newValue) : String(newValue);
      await SecureStore.setItemAsync(key, stringValue);
      return newValue;
    },
    onMutate: async (newValue: T) => {
      await queryClient.cancelQueries({ queryKey });
      const previousValue = queryClient.getQueryData<T>(queryKey);

      queryClient.setQueryData<T>(queryKey, newValue);

      return { previousValue };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData<T>(queryKey, context.previousValue);
      }
    },
  });

  return [data ?? initialValue, setValue, isLoading];
}
