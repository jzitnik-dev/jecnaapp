import { JecnaAPI } from '@jzitnik/jecnaapi-react-native';
import * as SecureStore from 'expo-secure-store';

type ExcludedMethods =
  | 'login'
  | 'isLoggedIn'
  | 'logout'
  | 'getCookie'
  | 'getSessionCookie'
  | 'setCookie';

type JecnaAPIFunctionKeys = Exclude<
  {
    [Key in keyof typeof JecnaAPI]: (typeof JecnaAPI)[Key] extends (
      ...args: any[]
    ) => any
      ? Key
      : never;
  }[keyof typeof JecnaAPI],
  ExcludedMethods
>;

export default async function withLogin<K extends JecnaAPIFunctionKeys>(
  methodName: K,
  ...args: Parameters<(typeof JecnaAPI)[K]>
): Promise<Awaited<ReturnType<(typeof JecnaAPI)[K]>>> {
  if (!(await JecnaAPI.isLoggedIn())) {
    const u = await SecureStore.getItemAsync('username');
    const p = await SecureStore.getItemAsync('password');

    if (!u || !p) {
      throw new Error('Not logged in');
    }

    const successful = await JecnaAPI.login(u, p);

    if (!successful) {
      throw new Error('Error while logging in');
    }
  }

  const func = JecnaAPI[methodName] as any;
  const result = await func(...args);

  return result;
}
