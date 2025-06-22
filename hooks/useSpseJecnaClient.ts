import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { SpseJecnaClient } from '../api/SpseJecnaClient';

interface SpseJecnaClientState {
  client: SpseJecnaClient | null;
  cookies: string;
  setClient: (client: SpseJecnaClient | null) => void;
  setCookies: (cookies: string) => void;
  logout: () => void;
}

export const useSpseJecnaClient = create<SpseJecnaClientState>((set) => ({
  client: null,
  cookies: '',
  setClient: (client) => set({ client }),
  setCookies: (cookies) => set({ cookies }),
  logout: async () => {
    // Clear account info cache
    try {
      await SecureStore.deleteItemAsync('account_info');
      await SecureStore.deleteItemAsync('account_info_timestamp');
    } catch (err) {
      console.warn('Failed to clear account info cache:', err);
    }
    set({ client: null, cookies: '' });
  },
})); 