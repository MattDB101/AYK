import { Outlet } from 'react-router-dom';
import MiniDrawer from './MiniDrawer/MiniDrawer';
import Header from './Header/Header';

export default function DashboardLayout() {
  return (
    <MiniDrawer>
      <Header />
      <Outlet />
    </MiniDrawer>
  );
}
