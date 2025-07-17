import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';

// pages
import Login from './pages/login/Login';
import OnboardingMenu from './components/OnboardingMenu';
import Dashboard from './pages/dashboard/Dashboard';

function App() {
  const { authIsReady, user } = useAuthContext();

  return (
    <div className="App">
      {authIsReady && (
        <BrowserRouter>
          <OnboardingMenu>
            <div>
              <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              </Routes>
            </div>
          </OnboardingMenu>

          <div>
            <Routes>
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
