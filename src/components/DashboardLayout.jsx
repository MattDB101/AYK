import { Outlet } from 'react-router-dom';
import MiniDrawer from './MiniDrawer/MiniDrawer';

export default function DashboardLayout() {
  return (
    <MiniDrawer>
      <Outlet />
    </MiniDrawer>
  );
}
