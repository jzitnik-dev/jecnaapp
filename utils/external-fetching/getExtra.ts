import { JecnaSuplClient } from '@jzitnik/jecna_supl_client_ts';
import type { StudentProfile } from '@jzitnik/jecnaapi-react-native/jecnaapi';
import * as SecureStore from 'expo-secure-store';

export async function getExtra() {
  const extraEnabled =
    (await SecureStore.getItemAsync('extraordinary_schedule_enabled')) ===
    'true';

  if (!extraEnabled) {
    return null;
  }

  const userInfoJson = await SecureStore.getItemAsync('account_info');

  if (!userInfoJson) {
    throw new Error('Not logged in');
  }

  const userInfo = JSON.parse(userInfoJson) as StudentProfile;

  const extraClient = new JecnaSuplClient(
    (await SecureStore.getItemAsync('extraordinary_schedule_custom_url')) ||
      undefined
  );

  return extraClient.getSchedule(userInfo.className || '');
}
