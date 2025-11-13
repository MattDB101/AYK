import { useEffect, useState } from 'react';
import { projectFirestore } from '../firebase/config';

export default function useSchoolClasses(schoolId) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!schoolId) {
      setClasses([]);
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      setLoading(true);
      setError(null);

      try {
        const snapshot = await projectFirestore
          .collection('schools')
          .doc(schoolId)
          .collection('classes')
          .orderBy('name')
          .get();

        const classList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClasses(classList);
      } catch (err) {
        console.error('Error fetching school classes:', err);
        setError(err.message || err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [schoolId]);

  return { classes, loading, error };
}
