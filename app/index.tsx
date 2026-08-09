import { useRouter } from 'expo-router';
import { getItemAsync } from 'expo-secure-store';
import { useEffect } from 'react';

export default function IndexRoute() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const layout = await getItemAsync('drawer-layout');
      router.replace(layout === 'tab' ? '/tabs' : '/drawer');
    })();
  }, [router]);

  return null;
}
