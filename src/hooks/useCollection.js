import { useEffect, useState } from 'react';
import { projectFirestore } from '../firebase/config';

export const useCollection = (collection, showInactive) => {
  const [documents, setDocuments] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ref = projectFirestore.collection(collection);

    const unsubscribe = ref.onSnapshot(
      (snapshot) => {
        let results = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log(showInactive);
          // Include documents where 'inactive' is not true
          if (!data.inactive || showInactive) {
            results.push({ ...data, id: doc.id });
          }
        });

        // Update state
        setDocuments(results);
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setError('Failed to get data.');
        setLoading(false);
      }
    );

    // Unsubscribe on unmount
    return () => unsubscribe();
  }, [collection]);

  return { documents, error, loading };
};
