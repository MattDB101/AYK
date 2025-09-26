import { useState, useEffect } from 'react';
import { projectAuth, projectFirestore } from '../firebase/config';
import { useAuthContext } from './useAuthContext';

export const useSignup = () => {
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const { dispatch } = useAuthContext();

  // Custom error messages
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Something went wrong. Please try again';
    }
  };

  const signup = async (email, password, school, county, userType) => {
    console.log('Signing up with:', { email, password, school, county });
    setError(null);
    setIsPending(true);
    console.log(email);
    try {
      // Create user with email and password
      const res = await projectAuth.createUserWithEmailAndPassword(email, password);

      if (!res) {
        throw new Error('Could not complete signup');
      }

      // Create a user document in Firestore
      await projectFirestore
        .collection('users')
        .doc(res.user.uid)
        .set({
          email: email,
          county: county,
          school: '/schools/' + school + '/',
          fname: '',
          lname: '',
          avatar: '',
          role: userType,
          createdAt: new Date(),
        });

      dispatch({ type: 'SIGNUP', payload: res.user });

      if (!isCancelled) {
        setIsPending(false);
        setError(null);
      }

      // Return the user object
      return res.user;
    } catch (err) {
      if (!isCancelled) {
        console.log(err.message);
        const customError = getErrorMessage(err.code);
        setError(customError);
        setIsPending(false);
      }
      throw err; // Re-throw error so Signup.jsx can catch it
    }
  };

  useEffect(() => {
    return () => setIsCancelled(true);
  }, []);

  return { signup, error, isPending };
};
