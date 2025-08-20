import React from 'react';
import styles from './SchoolManager.module.css';

function SchoolManager() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>School Management</h2>
        <p>Manage schools and their settings</p>
      </div>

      <div className={styles.content}>
        <div className={styles.comingSoon}>
          <h3>Coming Soon</h3>
          <p>School management features will be available here.</p>
        </div>
      </div>
    </div>
  );
}

export default SchoolManager;
