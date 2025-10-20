import { useState, useEffect } from 'react';
import { projectFirestore } from '../../firebase/config';
import { useAuthContext } from '../useAuthContext';

export const useTeacherLearningContent = () => {
  const { user } = useAuthContext();
  const [learningContent, setLearningContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.schoolId || !user.classId) {
      setLearningContent([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = projectFirestore
      .collection('uploaded-learning')
      .doc(user.schoolId)
      .collection('learning-content')
      .where('isActive', '==', true)
      .onSnapshot(
        (snapshot) => {
          const filtered = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((doc) => Array.isArray(doc.targetClasses) && doc.targetClasses.includes(user.classId));
          setLearningContent(filtered);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);
  return { learningContent, loading, error };
};
