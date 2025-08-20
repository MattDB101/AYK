import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import styles from './Header.module.css';

import Toolbar from '../Toolbar/Toolbar';

function Header() {
  const location = useLocation();

  const getPageName = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/orders') return 'Orders';
    if (path === '/recipes') return 'Recipe Book';
    if (path === '/learning') return 'Learning Center';
    if (path === '/settings') return 'Settings';
    if (path === '/forum') return 'Forum';
    return 'Dashboard';
  };

  return (
    <div className={styles.root}>
      <div className={styles.headerTitle}>{getPageName()}</div>
      <Toolbar />
    </div>
  );
}

export default Header;
