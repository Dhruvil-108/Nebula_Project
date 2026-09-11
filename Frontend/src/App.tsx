import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/shell/AppShell';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import DashboardPage from './pages/DashboardPage';
import CrmPage from './pages/modules/CrmPage';
import HrmsPage from './pages/modules/HrmsPage';
import RecruitmentPage from './pages/modules/RecruitmentPage';
import ExpensesPage from './pages/modules/ExpensesPage';
import InventoryPage from './pages/modules/InventoryPage';
import AnalyticsPage from './pages/modules/AnalyticsPage';
import { ManagePermissionsPage } from './pages/ManagePermissionsPage';
import { AccountCreatorPage } from './pages/AccountCreatorPage';
import ProfilePage from './pages/ProfilePage';

// ── TanStack Query client ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Scroll to top upon route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// ── Protected route: redirects to /signin if not authenticated ──
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Silent session restore in progress — show nothing to avoid flash
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
          <p className="text-xs text-slate-500 font-mono">Restoring session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
};

// ── Public route: redirects to /dashboard if already logged in ──
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// ── Super Admin route: redirects to /dashboard if user is not super_admin ──
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return user?.role === 'super_admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// ── Account Creator route: accessible to super_admin, admin, and hr ──
const AccountCreatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  const isAllowed = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr';
  return isAllowed ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// ── Placeholder pages for stub routes ──
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <p className="text-slate-400 text-sm">{title} — coming soon</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />

          {/* Toastify container — styled to match the dark design system */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="dark"
            toastStyle={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f1f5f9',
              fontSize: '13px',
              borderRadius: '12px',
            }}
          />

          <Routes>
            {/* ── Public routes ── */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUpPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signin"
              element={
                <PublicRoute>
                  <SignInPage />
                </PublicRoute>
              }
            />

            {/* ── Protected app shell ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="crm" element={<CrmPage />} />
              <Route path="hrms" element={<HrmsPage />} />
              <Route path="recruitment" element={<RecruitmentPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" />} />
              <Route path="org" element={<PlaceholderPage title="Organization" />} />
              <Route
                path="accounts"
                element={
                  <AccountCreatorRoute>
                    <AccountCreatorPage />
                  </AccountCreatorRoute>
                }
              />
              <Route
                path="permissions"
                element={
                  <SuperAdminRoute>
                    <ManagePermissionsPage />
                  </SuperAdminRoute>
                }
              />
              <Route
                path="org/permissions"
                element={
                  <SuperAdminRoute>
                    <ManagePermissionsPage />
                  </SuperAdminRoute>
                }
              />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* ── Wildcard ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
