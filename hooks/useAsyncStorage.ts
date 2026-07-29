import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseAsyncStorageOptions<T> {
  initialValue: T;
  customCacheKey?: string;
  parse?: (val: string) => T;
  stringify?: (val: T) => string;
}

export function useAsyncStorage<T>(
  key: string,
  options: UseAsyncStorageOptions<T>
): [T, (newValue: T) => void, boolean] {
  const queryClient = useQueryClient();
  const { initialValue, parse, stringify } = options;
  const queryKey = ['async-storage', options.customCacheKey || key];

  const { data, isLoading } = useQuery<T>({
    queryKey,
    queryFn: async (): Promise<T> => {
      const result = await AsyncStorage.getItem(key);
      if (result === null) return initialValue;
      return parse ? parse(result) : (result as unknown as T);
    },
    staleTime: Infinity,
  });

  const { mutate: setValue } = useMutation({
    mutationFn: async (newValue: T) => {
      if (stringify) {
        const stringValue = stringify(newValue);
        await AsyncStorage.setItem(key, stringValue);
      }
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
