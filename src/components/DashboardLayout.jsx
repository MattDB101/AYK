import { Outlet, useLocation } from 'react-router-dom';
import MiniDrawer from './MiniDrawer/MiniDrawer';
import Header from './Header/Header';

export default function DashboardLayout() {
  const location = useLocation();
  const hideHeaderOnPaths = ['/', '/dashboard'];
  const showHeader = !hideHeaderOnPaths.includes(location.pathname);

  return (
    <MiniDrawer>
      {showHeader && <Header />}
      <Outlet />
    </MiniDrawer>
  );
}
