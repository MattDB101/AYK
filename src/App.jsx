import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { projectFirestore } from './firebase/config';

// Import components
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import ProtectedAdminLayout from './components/ProtectedAdminLayout';
import Orders from './pages/orders/orders';
import RecipeBook from './pages/recipe-book/RecipeBook';
import RecipeBookLearning from './pages/learning-center/recipe-book/RecipeBook';
import RecipeContent from './pages/learning-center/recipe-book/recipe-content/RecipeContent';
import GeneralLearning from './pages/learning-center/general-learning/GeneralLearning';
import GeneralLearningContent from './pages/learning-center/general-learning/general-learning-content/GeneralLearningContent';
import LearningCenter from './pages/learning-center/LearningCenter';
import Settings from './pages/settings/Settings';
import Forum from './pages/forum/Forum';
import SetupProfile from './pages/setup-profile/SetupProfile';
import AdminPanel from './pages/admin/AdminPanel';
import CreateRecipe from './pages/admin/recipe-manager/CreateRecipe';
import CreateGeneralLearning from './pages/admin/general-learning-manager/CreateGeneralLearning';
import EditRecipe from './pages/admin/recipe-manager/EditRecipe';
import EditGeneralLearning from './pages/admin/general-learning-manager/EditGeneralLearning';
import Cart from './pages/orders/cart/Cart';

function App() {
  const { user, authIsReady } = useAuthContext();
  const [profileComplete, setProfileComplete] = useState(null); // null = checking, true/false = result
  const [profileCheckDone, setProfileCheckDone] = useState(false);

  // Check if user profile is complete
  useEffect(() => {
    if (!user?.uid) {
      setProfileCheckDone(true);
      return;
    }

    const checkProfile = async () => {
      try {
        const userDoc = await getDoc(doc(projectFirestore, 'users', user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Profile is complete if they have first and last name
          const isComplete = !!(userData.fname && userData.lname);
          setProfileComplete(isComplete);
        } else {
          // No profile document = incomplete
          setProfileComplete(false);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, assume incomplete to be safe
        setProfileComplete(false);
      } finally {
        setProfileCheckDone(true);
      }
    };

    checkProfile();
  }, [user?.uid]);

  // Show loading while checking auth and profile
  if (!authIsReady || (user && !profileCheckDone)) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {!user && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
          {user && (
            <>
              {/* If profile is incomplete, force setup */}
              {profileComplete === false ? (
                <>
                  <Route path="/setup-profile" element={<SetupProfile />} />
                  <Route path="*" element={<Navigate to="/setup-profile" />} />
                </>
              ) : (
                <>
                  {/* Profile is complete, show normal app */}
                  <Route path="/setup-profile" element={<Navigate to="/" />} />
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="recipes" element={<RecipeBook />} />
                    <Route path="learning/recipes" element={<RecipeBookLearning />} />
                    <Route path="learning/recipes/:recipeId" element={<RecipeContent />} />
                    <Route path="learning/general" element={<GeneralLearning />} />
                    <Route path="learning/general/:generalLearningId" element={<GeneralLearningContent />} />
                    <Route path="learning" element={<LearningCenter />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="forum" element={<Forum />} />
                    <Route path="orders/cart" element={<Cart />} />

                    {/* Admin Routes */}
                    <Route path="admin" element={<ProtectedAdminLayout />}>
                      <Route index element={<AdminPanel />} />
                      <Route path="general-learning/create" element={<CreateGeneralLearning />} />
                      <Route path="general-learning/edit/:generalLearningId" element={<EditGeneralLearning />} />
                      <Route path="recipes/create" element={<CreateRecipe />} />
                      <Route path="recipes/edit/:recipeId" element={<EditRecipe />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
            </>
          )}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
