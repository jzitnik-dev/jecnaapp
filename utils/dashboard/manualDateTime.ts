import * as SecureStore from 'expo-secure-store';

export const CUSTOM_TIME_OFFSET_KEY = 'debug_custom_time_offset';

export const getCurrentDateTime = async (): Promise<Date> => {
  const offsetStr = await SecureStore.getItemAsync(CUSTOM_TIME_OFFSET_KEY);
  const offsetMs = offsetStr ? Number(offsetStr) : 0;

  if (!offsetMs) return new Date();

  return new Date(Date.now() + offsetMs);
};
