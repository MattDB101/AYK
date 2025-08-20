import { useState, useEffect } from 'react';
import { projectFirestore } from '../firebase/config';
import { useAuthContext } from './useAuthContext';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Use real-time listener instead of one-time fetch
    const unsubscribe = projectFirestore
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setProfile({ id: doc.id, ...doc.data() });
          } else {
            // Document doesn't exist - new user needs profile setup
            setProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching user profile:', err);
          setError(err.message);
          setProfile(null);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  return { profile, loading, error };
};
