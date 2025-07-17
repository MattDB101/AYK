import styles from './Login.module.css';
import React from 'react';
import { useState } from 'react';
import { useLogin } from '../../hooks/useLogin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className={styles['login-form-container']}>
      <img src="/AYK50.png" alt="logo" />
      <form onSubmit={handleSubmit} className={styles['login-form']}>
        <div className={styles['login-form-contents']}>
          <h2>Log In</h2>
          <label>
            <span>Email</span>
            <input type="email" onChange={(e) => setEmail(e.target.value)} value={email} />
          </label>

          <label>
            <span>Password</span>
            <input type="password" onChange={(e) => setPassword(e.target.value)} value={password} />
          </label>

          {!isPending && <button className="btn">Log in</button>}
          {isPending && (
            <button className="btn" disabled>
              Loading
            </button>
          )}
          {error && <p className="err">{error}</p>}
        </div>
      </form>
    </div>
  );
}
