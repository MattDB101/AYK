import styles from './Signup.module.css';
import React from 'react';
import { useState } from 'react';
import { useSignup } from '../../hooks/useSignup';
import { projectFirestore } from '../../firebase/config';
import { Link } from 'react-router-dom';
export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const { signup, error, isPending } = useSignup();

  const checkUserRecord = async (email) => {
    try {
      // Check both teachers and students collections
      const [teacherQuery, studentQuery] = await Promise.all([
        projectFirestore.collection('teachers').where('email', '==', email).get(),
        projectFirestore.collection('students').where('email', '==', email).get(),
      ]);

      // Check teachers first
      if (!teacherQuery.empty) {
        return {
          doc: teacherQuery.docs[0],
          userType: 'teacher',
        };
      }

      // Check students
      if (!studentQuery.empty) {
        return {
          doc: studentQuery.docs[0],
          userType: 'student',
        };
      }

      return null; // No user found in either collection
    } catch (error) {
      console.error('Error checking user record:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword || confirmPassword === '') {
      setValidationError("Passwords don't match!");
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters!');
      return;
    }

    setValidationError(null);
    setIsCheckingUser(true);

    try {
      // Check if user record exists in either collection
      const userRecord = await checkUserRecord(email);

      if (!userRecord) {
        setValidationError('No user record found for this email. Please contact your administrator.');
        setIsCheckingUser(false);
        return;
      }

      const userData = userRecord.doc.data();
      const userType = userRecord.userType;

      // Check if account was already created
      if (userData.accountCreated) {
        setValidationError('An account has already been created for this email.');
        setIsCheckingUser(false);
        return;
      }

      // Use the user's assigned data from the database
      const finalCounty = userData.county || '';
      const finalSchoolId = userData.schoolId || '';

      // Proceed with signup using data from user record
      // Note: You might need to update useSignup to handle different user types
      const user = await signup(email, password, finalSchoolId, finalCounty, userType);

      if (user) {
        // Update the user record to mark account as created and link to user
        await projectFirestore
          .collection(userType === 'teacher' ? 'teachers' : 'students')
          .doc(userRecord.doc.id)
          .update({
            accountCreated: true,
            userId: user.uid,
            updatedAt: new Date(),
          });
      }
    } catch (error) {
      setValidationError('Error during signup: ' + error.message);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const isFormDisabled = isPending || isCheckingUser;

  return (
    <div className={styles['signup-form-container']}>
      <img src="/AYK50.png" alt="logo" />
      <form onSubmit={handleSubmit} className={styles['signup-form']}>
        <div className={styles['signup-form-contents']}>
          <h2>Create your account</h2>
          <p className={styles['signup-subtitle']}>Please use the email address provided by your administrator</p>

          <label>
            <span>Email</span>
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              disabled={isFormDisabled}
              placeholder="Enter your email address"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              disabled={isFormDisabled}
              placeholder="Enter your password"
              minLength="6"
              required
            />
          </label>

          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              disabled={isFormDisabled}
              placeholder="Confirm your password"
              minLength="6"
              required
            />
          </label>
          <div className={styles['signup-link']}>
            <p>
              Already have an account? <Link to="/login">Log in here</Link>
            </p>
          </div>

          {!isFormDisabled && <button className="btn">Create Account</button>}
          {isFormDisabled && (
            <button className="btn" disabled>
              {isCheckingUser ? 'Verifying user record...' : 'Creating account...'}
            </button>
          )}

          {error && <div className={styles.err}>{error}</div>}
          {validationError && <div className={styles.err}>{validationError}</div>}
        </div>
      </form>
    </div>
  );
}
