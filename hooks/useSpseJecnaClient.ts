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
  logout: () => set({ client: null, cookies: '' }),
})); 