import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '../../hooks/useLogout';
import { useAuthContext } from '../../hooks/useAuthContext';
import styles from './MiniDrawer.module.css';

import DashboardSquare02Icon from '../icons/dashboard-square-02-stroke-rounded';
import ShoppingCart01Icon from '../icons/shopping-cart-01-stroke-rounded';
import Logout02StrokeRounded from '../icons/logout-02-stroke-rounded';
import BubbleChatStrokeRounded from '../icons/bubble-chat-stroke-rounded';
import Notebook01StrokeRouneded from '../icons/notebook-01-stroke-rounded';
import ChefHatStrokeRouneded from '../icons/chef-hat-stroke-rounded';
import Setting07StrokeRounded from '../icons/setting-07-stroke-rounded';

export default function MiniDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useLogout();
  const { user } = useAuthContext();

  // Determine active item based on current route
  const getActiveItem = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/dashboard')) return 'Dashboard';
    if (path === '/orders' || path.startsWith('/orders/')) return 'Orders';
    if (path === '/recipes' || path.startsWith('/recipes/'))
      return 'Recipe Book';
    if (path === '/learning' || path.startsWith('/learning/'))
      return 'Learning Center';
    if (path === '/forum' || path.startsWith('/forum/')) return 'Forum';
    if (path === '/settings' || path.startsWith('/settings/'))
      return 'Settings';
    if (path === '/admin' || path.startsWith('/admin/')) return 'Admin Panel';
    return 'Dashboard';
  };

  const activeItem = getActiveItem();

  const handleNavClick = (itemName, customOnClick) => {
    if (customOnClick) {
      customOnClick();
      return;
    }

    switch (itemName) {
      case 'Dashboard':
        navigate('/');
        break;
      case 'Orders':
        navigate('/orders');
        break;
      case 'Recipe Book':
        navigate('/recipes');
        break;
      case 'Learning Center':
        navigate('/learning');
        break;
      case 'Forum':
        navigate('/forum');
        break;
      case 'Settings':
        navigate('/settings');
        break;
      case 'Admin':
        navigate('/admin');
        break;
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      icon: <DashboardSquare02Icon size={24} color="currentColor" />,
    },
    {
      name: 'Orders',
      icon: <ShoppingCart01Icon size={24} color="currentColor" />,
    },
    {
      name: 'Recipe Book',
      icon: <ChefHatStrokeRouneded size={24} color="currentColor" />,
    },
    {
      name: 'Learning Center',
      icon: <Notebook01StrokeRouneded size={24} color="currentColor" />,
    },
    {
      name: 'Forum',
      icon: <BubbleChatStrokeRounded size={24} color="currentColor" />,
    },
    {
      name: 'Settings',
      icon: <Setting07StrokeRounded size={24} color="currentColor" />,
    },
    {
      name: 'Admin',
      icon: <Setting07StrokeRounded size={24} color="currentColor" />,
    },
    {
      name: 'Logout',
      icon: <Logout02StrokeRounded size={24} color="currentColor" />,
      onClick: logout,
    },
  ];

  return (
    <div className={styles.root}>
      <div
        className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}
      >
        <div className={styles.drawerHeader}>
          <img
            src="/menu-icon.png"
            alt="Menu"
            onClick={() => setIsOpen(!isOpen)}
            className={styles.menuButton}
          ></img>
          {isOpen ? (
            <img
              src="/AYK open drawer logo.png"
              alt="AYK Logo"
              className={styles.openLogo}
            />
          ) : (
            <img
              src="/AYK closed drawer logo.png"
              alt="AYK Logo"
              className={styles.closedLogo}
            />
          )}
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <div
              key={item.name}
              className={`${styles.navItem} ${
                activeItem === item.name ? styles.active : ''
              } ${item.name === 'Logout' ? styles.logoutItem : ''}`}
              onClick={() => handleNavClick(item.name, item.onClick)}
            >
              <span className={styles.icon}>{item.icon}</span>
              {isOpen && <span>{item.name}</span>}
            </div>
          ))}
        </nav>
      </div>

      <div className={`${styles.content} ${isOpen ? styles.contentShift : ''}`}>
        {children}
      </div>
    </div>
  );
}
