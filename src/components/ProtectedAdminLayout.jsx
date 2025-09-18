import { useAuthContext } from '../hooks/useAuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedAdminLayout = () => {
  const { user } = useAuthContext();

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminLayout;
