import { useState, useEffect, useCallback } from 'react';
import studentService from '../services/studentService';
import { transformStudent } from '../../../utils/transformers';

export function useStudents({ classId = null, isTeacher = false } = {}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher && classId) {
        const res = await studentService.getTeacherStudents({ classId, limit: 100 });
        setStudents((res.students || []).map(transformStudent));
      } else {
        const res = await studentService.getAdminStudents({ limit: 100 });
        setStudents((res.students || []).map(transformStudent));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classId, isTeacher]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, setStudents, loading, error, refetch: fetchStudents };
}

export default useStudents;
