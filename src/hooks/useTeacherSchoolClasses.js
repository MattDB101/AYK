import { useState, useEffect } from 'react';
import { projectFirestore } from '../firebase/config';
import { useAuthContext } from './useAuthContext';

export const useTeacherSchoolClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchTeacherSchoolClasses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Find the teacher record by userId
        const teacherQuery = await projectFirestore
          .collection('teachers')
          .where('userId', '==', user.uid)
          .get();

        if (teacherQuery.empty) {
          setError('Teacher record not found');
          setLoading(false);
          return;
        }

        const teacherData = teacherQuery.docs[0].data();
        const schoolId = teacherData.schoolId;
        const schoolName = teacherData.schoolName;

        if (!schoolId) {
          setError('No school assigned to teacher');
          setLoading(false);
          return;
        }

        setSchoolInfo({ id: schoolId, name: schoolName });

        // Get classes from the school's subcollection
        const classesSnapshot = await projectFirestore
          .collection('schools')
          .doc(schoolId)
          .collection('classes')
          .orderBy('name')
          .get();

        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClasses(classesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching teacher school classes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherSchoolClasses();
  }, [user]);

  return { classes, schoolInfo, loading, error };
};