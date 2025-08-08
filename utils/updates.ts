import Constants from 'expo-constants';
import { useEffect, useState } from 'react';

export function gt(v1: string, v2: string): boolean {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const numA = a[i] || 0;
    const numB = b[i] || 0;
    if (numA > numB) return true;
    if (numA < numB) return false;
  }
  return false;
}

const URL =
  'https://api.github.com/repos/jzitnik-dev/jecnamobile/releases/latest';

export default function useIsUpdateAvailable() {
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(URL);
      const json = await res.json();
      const latestVer = json.name;

      const installedVer = Constants.expoConfig?.version || '1.0.0';

      if (gt(latestVer, installedVer)) {
        setIsUpdate(true);
      }
    })();
  }, []);

  return isUpdate;
}
