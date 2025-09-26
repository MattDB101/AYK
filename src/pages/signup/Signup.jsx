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
  const [isCheckingTeacher, setIsCheckingTeacher] = useState(false);

  const { signup, error, isPending } = useSignup();

  const checkTeacherRecord = async (email) => {
    try {
      const teacherQuery = await projectFirestore.collection('teachers').where('email', '==', email).get();

      if (!teacherQuery.empty) {
        return teacherQuery.docs[0]; // Return the teacher document
      }
      return null;
    } catch (error) {
      console.error('Error checking teacher record:', error);
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
    setIsCheckingTeacher(true);

    try {
      // Check if teacher record exists
      const teacherDoc = await checkTeacherRecord(email);

      if (!teacherDoc) {
        setValidationError('No teacher record found for this email. Please contact your administrator.');
        setIsCheckingTeacher(false);
        return;
      }

      const teacherData = teacherDoc.data();

      // Check if account was already created
      if (teacherData.accountCreated) {
        setValidationError('An account has already been created for this email.');
        setIsCheckingTeacher(false);
        return;
      }

      // Use the teacher's assigned data from the database
      const finalCounty = teacherData.county || '';
      const finalSchoolId = teacherData.schoolId || '';

      // Proceed with signup using data from teacher record
      const user = await signup(email, password, finalSchoolId, finalCounty);

      if (user) {
        // Update the teacher record to mark account as created and link to user
        await projectFirestore.collection('teachers').doc(teacherDoc.id).update({
          accountCreated: true,
          userId: user.uid,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      setValidationError('Error during signup: ' + error.message);
    } finally {
      setIsCheckingTeacher(false);
    }
  };

  const isFormDisabled = isPending || isCheckingTeacher;

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
              {isCheckingTeacher ? 'Verifying teacher record...' : 'Creating account...'}
            </button>
          )}

          {error && <div className={styles.err}>{error}</div>}
          {validationError && <div className={styles.err}>{validationError}</div>}
        </div>
      </form>
    </div>
  );
}
