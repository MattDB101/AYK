import React from 'react';
import styles from './LoadingDots.module.css';

function LoadingDots({ text = 'Loading' }) {
  return (
    <div className={styles.loadingContainer}>
      <span className={styles.loadingText}>{text}</span>
      <div className={styles.dots}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
    </div>
  );
}

export default LoadingDots;
