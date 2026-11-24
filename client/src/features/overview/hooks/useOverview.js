import { useState, useEffect, useCallback } from 'react';
import overviewService from '../services/overviewService';

export function useOverview({ workspace = 'admin', classId = null } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      if (workspace === 'admin') {
        const res = await overviewService.getAdminOverview();
        setData(res);
      } else {
        const res = await overviewService.getTeacherOverview({ classId });
        setData(res);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspace, classId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { data, loading, error, refetch: fetchOverview };
}

export default useOverview;
