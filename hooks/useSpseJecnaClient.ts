import '@/pollyfils/web-self';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { SpseJecnaClient } from '../api/SpseJecnaClient';
import { removeItem } from '@/utils/secureStore';

interface SpseJecnaClientState {
  client: SpseJecnaClient | null;
  cookies: string;
  setClient: (client: SpseJecnaClient | null) => void;
  setCookies: (cookies: string) => void;
  logout: () => Promise<void>;
}

export const useSpseJecnaClient = create<SpseJecnaClientState>((set, get) => ({
  client: null,
  cookies: '',
  setClient: client => set({ client }),
  setCookies: cookies => set({ cookies }),
  logout: async () => {
    const client = get().client;
    try {
      await client?.logout();
      await removeItem('account_info');
      await removeItem('account_info_timestamp');
      await removeItem('username');
      await removeItem('password');
      await AsyncStorage.clear();
    } catch (err) {
      console.warn('Failed to clear account info cache:', err);
    }
    set({ client: null, cookies: '' });
  },
}));
