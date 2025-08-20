import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './hooks/useAuthContext';

// Import components
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardLayout from './components/DashboardLayout';
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

function App() {
  const { user, authIsReady } = useAuthContext();

  return (
    <div className="App">
      {authIsReady && (
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
                <Route path="/setup-profile" element={<SetupProfile />} />
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
                  <Route path="admin" element={<AdminPanel />} />
                  <Route path="admin/general-learning/create" element={<CreateGeneralLearning />} />
                  <Route path="admin/general-learning/edit/:generalLearningId" element={<EditGeneralLearning />} />
                  <Route path="admin/recipes/create" element={<CreateRecipe />} />
                  <Route path="admin/recipes/edit/:recipeId" element={<EditRecipe />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
