import { create } from 'zustand';
import { JecnaSuplClient } from '@jzitnik/jecna_supl_client_ts';

interface JecnaRozvrhClientState {
  client: JecnaSuplClient | null;
  setClient: (client: JecnaSuplClient | null) => void;
}

export const useJecnaRozvrhClient = create<JecnaRozvrhClientState>(set => ({
  client: null,
  setClient: client => set({ client }),
}));
