import { useState, useEffect, useCallback } from 'react';
import scheduleService from '../services/scheduleService';

export function useSchedule(params = {}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scheduleService.getSchedule(params);
      setSessions(res.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return { sessions, loading, error, refetch: fetchSchedule };
}

export default useSchedule;
