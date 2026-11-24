import { useState, useCallback } from 'react';
import attendanceService from '../services/attendanceService';

export function useAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveDraft = useCallback(async (data) => {
    setLoading(true);
    try {
      return await attendanceService.saveAttendance(data);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitFinal = useCallback(async (id) => {
    setLoading(true);
    try {
      return await attendanceService.submitAttendance(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveDraft, submitFinal, loading, error };
}

export default useAttendance;
