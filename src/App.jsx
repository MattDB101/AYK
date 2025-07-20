import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';
import { useUserProfile } from './hooks/useUserProfile';

// pages
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import OnboardingMenu from './components/OnboardingMenu';
import Dashboard from './pages/dashboard/Dashboard';
import SetupProfile from './pages/setup-profile/SetupProfile';

function App() {
  const { authIsReady, user } = useAuthContext();
  const { profile, loading } = useUserProfile();

  if (!authIsReady || (user && loading)) {
    return <div>Loading...</div>;
  }

  // Check if user needs to complete profile
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
                <Navigate to="/" />
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
                <Navigate to="/" />
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

          <Route
            path="/"
            element={
              !user ? <Navigate to="/login" /> : needsProfileSetup ? <Navigate to="/setup-profile" /> : <Dashboard />
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
