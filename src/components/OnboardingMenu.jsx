import React from 'react';
import styles from './OnboardingMenu.module.css';
import { Link } from 'react-router-dom';

function OnboardingMenu({ children }) {
  return (
    <div className={styles.OnboardingMenu}>
      <div className={styles.navbarLogo}>
        <span className={styles.logoBold}>Allyouknead.ie</span>
      </div>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <ul className={styles.navbarLinks}>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/services">Services</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/how-it-works">How it Works</Link>
            </li>
          </ul>

          <div className={styles.navbarButtons}>
            <Link to="/signup" className={`${styles.btn} ${styles.signupBtn}`}>
              Sign Up
            </Link>
            <Link to="/login" className={`${styles.btn} ${styles.loginBtn}`}>
              Log In
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

export default OnboardingMenu;
