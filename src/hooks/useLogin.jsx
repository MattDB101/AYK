import { useState, useEffect } from 'react';
import { projectAuth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthContext } from './useAuthContext';

export const useLogin = () => {
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const { dispatch } = useAuthContext();

  const login = async (email, password) => {
    setError(null);
    setIsPending(true);

    try {
      const res = await signInWithEmailAndPassword(projectAuth, email, password);

      // Get ID token with custom claims
      const tokenResult = await res.user.getIdTokenResult();

      const userData = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName,
        emailVerified: res.user.emailVerified,
        photoURL: res.user.photoURL,
        phoneNumber: res.user.phoneNumber,
        isAdmin: tokenResult.claims.isAdmin || false,
        role: tokenResult.claims.role || 'student',
      };

      if (!isCancelled) {
        dispatch({ type: 'LOGIN', payload: userData });
        setIsPending(false);
        setError(null);
      }
    } catch (err) {
      if (!isCancelled) {
        setError(err.message);
        setIsPending(false);
      }
    }
  };

  useEffect(() => {
    return () => setIsCancelled(true);
  }, []);

  return { login, isPending, error };
};
