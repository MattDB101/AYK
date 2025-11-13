import { useEffect, useState } from 'react';
import { projectFirestore } from '../firebase/config';

export default function useClassOrder(classId) {
  const [classOrder, setClassOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(classId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classId) {
      setClassOrder(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = projectFirestore.collection('classOrders').doc(String(classId));

    const unsubscribe = docRef.onSnapshot(
      (doc) => {
        if (!doc.exists) {
          setClassOrder(null);
        } else {
          setClassOrder({ id: doc.id, ...doc.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.error('useClassOrder onSnapshot error:', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [classId]);

  return { classOrder, loading, error };
}
