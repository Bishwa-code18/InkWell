// App.jsx — Root application with routing
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { fetchCurrentUser, updateUserSettings } from './store/authSlice';
import { selectIsAuthenticated, selectUser } from './store/authSlice';
import { fetchNotifications } from './store/notificationsSlice';
import { selectDarkMode } from './store/uiSlice';
import { useSocket } from './hooks/useSocket';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import RightPanel from './components/layout/RightPanel';
import Footer from './components/layout/Footer';
import { FullPageSpinner } from './components/shared/Spinner';

// Pages (lazy for code splitting)
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const CreateCommunityPage = lazy(() => import('./pages/CreateCommunityPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ModerationDashboard = lazy(() => import('./pages/ModerationDashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

// ── Protected Route ────────────────────────────────────────────────────────
function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// ── Auth-only redirect (already logged in) ─────────────────────────────────
function AuthRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

// ── Root Index Redirect ────────────────────────────────────────────────────
function RootIndex() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // Logged-in users see the feed, logged-out users see the landing page
  return isAuthenticated ? <HomePage /> : <Navigate to="/welcome" replace />;
}

// ── Mod/Admin Route Protector ──────────────────────────────────────────────
function ModRoute() {
  const user = useSelector(selectUser);
  const isAuthorized = user?.role === 'moderator' || user?.role === 'admin';
  return isAuthorized ? <Outlet /> : <Navigate to="/" replace />;
}

// ── Standard Layout (with sidebar + right panel) ───────────────────────────
function MainLayout() {
  const darkMode = useSelector(selectDarkMode);
  const isDark = useSelector((s) => s.auth.user?.settings?.darkMode) ?? darkMode;

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      <Navbar />
      <div className="max-w-[1400px] mx-auto flex gap-4 px-4 pt-4 pb-8">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Suspense fallback={<FullPageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
        <RightPanel />
      </div>
      <Footer />
    </div>
  );
}

// ── Narrow Layout (no sidebar/right panel — for auth pages) ───────────────
function FullPageLayout() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Outlet />
    </Suspense>
  );
}

// ── App Initializer ────────────────────────────────────────────────────────
function AppInit() {
  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuthenticated);
  useSocket(); // Start socket connection for authenticated users

  useEffect(() => {
    dispatch(fetchCurrentUser()); // Check if stored token is still valid
    if (isAuth) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuth]);

  return null;
}

// ── Router ─────────────────────────────────────────────────────────────────
function Router() {
  return (
    <BrowserRouter>
      <AppInit />
      <Routes>
        {/* Landing page — standalone, no sidebar */}
        <Route element={<FullPageLayout />}>
          <Route path="/welcome" element={<LandingPage />} />
          <Route element={<AuthRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Main layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<RootIndex />} />
          <Route path="/popular" element={<HomePage />} />
          <Route path="/all" element={<HomePage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/s/:slug" element={<CommunityPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/communities/create" element={<CreateCommunityPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Moderation */}
            <Route element={<ModRoute />}>
              <Route path="/mod" element={<ModerationDashboard />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="card py-16 text-center">
              <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
              <p className="text-gray-500 mb-4">This page wandered off into the Inkwell...</p>
              <a href="/" className="btn-primary btn-sm">Return Home</a>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Provider store={store}>
      <Router />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#1A6B47', secondary: '#fff' },
          },
        }}
      />
    </Provider>
  );
}
