import { createContext, useReducer, useEffect } from 'react';
import { projectAuth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'AUTH_IS_READY':
      return { user: action.payload, authIsReady: true };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    authIsReady: false,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(projectAuth, async (user) => {
      if (user) {
        try {
          let tokenResult = await user.getIdTokenResult();

          if (!tokenResult.claims.schoolId) {
            await user.getIdToken(true);
            tokenResult = await user.getIdTokenResult();
          }

          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            photoURL: user.photoURL,
            phoneNumber: user.phoneNumber,
            isAdmin: tokenResult.claims.isAdmin || false,
            role: tokenResult.claims.role || 'student',
            schoolId: tokenResult.claims.schoolId,
            classId: tokenResult.claims.classId,
          };

          console.log('User with custom claims:', userData);
          dispatch({ type: 'AUTH_IS_READY', payload: userData });
        } catch (error) {
          console.error('Error getting custom claims:', error);
          dispatch({
            type: 'AUTH_IS_READY',
            payload: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              emailVerified: user.emailVerified,
              photoURL: user.photoURL,
              phoneNumber: user.phoneNumber,
              isAdmin: false,
              role: 'student',
              schoolId: undefined,
              classId: undefined,
            },
          });
        }
      } else {
        dispatch({ type: 'AUTH_IS_READY', payload: null });
      }
    });

    return () => unsub();
  }, []);

  return <AuthContext.Provider value={{ ...state, dispatch }}>{children}</AuthContext.Provider>;
};
