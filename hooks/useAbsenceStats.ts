import { useCallback, useEffect, useState } from 'react';
import type { OmluvnyListResult } from '../api/SpseJecnaClient';
import { useSpseJecnaClient } from './useSpseJecnaClient';

export interface AbsenceStats {
  totalExcused: number;
  totalUnexcused: number;
  totalAbsences: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAbsenceStats(): AbsenceStats {
  const { client } = useSpseJecnaClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OmluvnyListResult | null>(null);

  const fetchData = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    try {
      const result = await client.getOmluvnyList();
      setData(result);
    } catch (e) {
      setError('Nepodařilo se načíst omluvný list.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      fetchData();
    }
  }, [fetchData, client]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals
  let totalExcused = 0;
  let totalUnexcused = 0;
  let totalAbsences = 0;

  if (data && data.absences) {
    for (const absence of data.absences) {
      totalAbsences += absence.count;
      if (absence.countUnexcused) {
        totalUnexcused += absence.countUnexcused;
        totalExcused += absence.count - absence.countUnexcused;
      } else {
        totalExcused += absence.count;
      }
    }
  }

  return {
    totalExcused,
    totalUnexcused,
    totalAbsences,
    loading,
    error,
    refresh,
  };
}
