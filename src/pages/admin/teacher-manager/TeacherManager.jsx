import React from 'react';
import styles from './TeacherManager.module.css';

function TeacherManager() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Teacher Management</h2>
        <p>Manage teachers and their permissions</p>
      </div>

      <div className={styles.content}>
        <div className={styles.comingSoon}>
          <h3>Coming Soon</h3>
          <p>Teacher management features will be available here.</p>
        </div>
      </div>
    </div>
  );
}

export default TeacherManager;
