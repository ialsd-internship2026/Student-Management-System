import { useState, useEffect, useCallback } from 'react';
import teacherService from '../services/teacherService';
import { transformTeacher } from '../../../utils/transformers';

export function useTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherService.getTeachers();
      const list = (res.teachers || []).map(transformTeacher);
      setTeachers(list);
      const depts = [...new Set(list.map(t => t.department).filter(Boolean))];
      if (depts.length > 0) setDepartments(depts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return { teachers, setTeachers, departments, setDepartments, loading, error, refetch: fetchTeachers };
}

export default useTeachers;
