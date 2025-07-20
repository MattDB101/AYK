import { useState, useEffect } from 'react';
import { projectFirestore } from '../firebase/config';

export const useSchools = (selectedCounty) => {
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedCounty) {
      setSchools([]);
      return;
    }

    console.log('Fetching schools for county:', selectedCounty);

    const fetchSchools = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const snapshot = await projectFirestore.collection('schools').where('county', '==', selectedCounty).get();

        const schoolList = snapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
          ...doc.data(),
        }));

        setSchools(schoolList);
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError(err.message);
        setSchools([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, [selectedCounty]);

  return { schools, isLoading, error };
};
