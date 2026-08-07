import { useEffect, useRef } from 'react';
import { JecnaSuplClient } from '@jzitnik/jecna_supl_client_ts';
import { useSecureStore } from '@/hooks/useSecureStore';
import { useJecnaRozvrhClient } from '@/hooks/useJecnaRozvrhClient';

export default function JecnaRozvrhClientManager() {
  const [enabled, , isLoadingEnabled] = useSecureStore<boolean>(
    'extraordinary_schedule_enabled',
    {
      initialValue: false,
      parse: val => val === 'true',
      stringify: val => (val ? 'true' : 'false'),
    }
  );

  const [customUrl, , isLoadingUrl] = useSecureStore<string>(
    'extraordinary_schedule_custom_url',
    {
      initialValue: '',
      parse: val => val,
      stringify: val => val,
    }
  );

  const setClient = useJecnaRozvrhClient(state => state.setClient);

  const activeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoadingEnabled || isLoadingUrl) return;

    const currentClient = useJecnaRozvrhClient.getState().client;

    if (enabled) {
      const finalUrl = customUrl.trim() !== '' ? customUrl.trim() : undefined;

      if (!currentClient || activeUrlRef.current !== (finalUrl ?? null)) {
        setClient(new JecnaSuplClient(finalUrl));
        activeUrlRef.current = finalUrl ?? null;
      }
    } else if (!enabled && currentClient) {
      setClient(null);
      activeUrlRef.current = null;
    }
  }, [enabled, customUrl, isLoadingEnabled, isLoadingUrl, setClient]);

  return null;
}
