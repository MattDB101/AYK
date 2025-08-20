import React from 'react';
import styles from './ClassManager.module.css';

function ClassManager() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Class Management</h2>
        <p>Manage classes and student assignments</p>
      </div>

      <div className={styles.content}>
        <div className={styles.comingSoon}>
          <h3>Coming Soon</h3>
          <p>Class management features will be available here.</p>
        </div>
      </div>
    </div>
  );
}

export default ClassManager;
