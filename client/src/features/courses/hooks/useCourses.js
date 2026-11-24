import { useState, useEffect, useCallback } from 'react';
import courseService from '../services/courseService';
import { transformCourse, transformSection } from '../../../utils/transformers';

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCoursesAndSections = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, classesRes] = await Promise.all([
        courseService.getCourses().catch(() => ({ courses: [] })),
        courseService.getClasses().catch(() => ({ classes: [] }))
      ]);
      setCourses((coursesRes.courses || []).map(transformCourse));
      setSections((classesRes.classes || []).map(transformSection));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoursesAndSections();
  }, [fetchCoursesAndSections]);

  return { courses, setCourses, sections, setSections, loading, error, refetch: fetchCoursesAndSections };
}

export default useCourses;
