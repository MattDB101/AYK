import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';
import { useUserProfile } from './hooks/useUserProfile';

// pages
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import OnboardingMenu from './components/OnboardingMenu';
import Dashboard from './pages/dashboard/Dashboard';
import Orders from './pages/orders/orders.jsx';
import RecipeBook from './pages/recipe-book/RecipeBook';
import LearningCenter from './pages/learning-center/LearningCenter';
import Settings from './pages/settings/Settings';
import Forum from './pages/forum/Forum';
import SetupProfile from './pages/setup-profile/SetupProfile';
import DashboardLayout from './components/DashboardLayout';

function App() {
  const { authIsReady, user } = useAuthContext();
  const { profile, loading } = useUserProfile();

  if (!authIsReady || (user && loading)) {
    return <div>Loading...</div>;
  }

  const needsProfileSetup = user && profile && (!profile.fname || !profile.lname);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              !user ? (
                <OnboardingMenu>
                  <Login />
                </OnboardingMenu>
              ) : (
                <Navigate to="/orders" />
              )
            }
          />
          <Route
            path="/signup"
            element={
              !user ? (
                <OnboardingMenu>
                  <Signup />
                </OnboardingMenu>
              ) : (
                <Navigate to="/orders" />
              )
            }
          />
          <Route
            path="/setup-profile"
            element={
              user ? (
                <OnboardingMenu>
                  <SetupProfile />
                </OnboardingMenu>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Protected dashboard routes */}
          <Route
            path="/"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : needsProfileSetup ? (
                <Navigate to="/setup-profile" />
              ) : (
                <DashboardLayout />
              )
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="recipes" element={<RecipeBook />} />
            <Route path="learning" element={<LearningCenter />} />
            <Route path="settings" element={<Settings />} />
            <Route path="forum" element={<Forum />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
