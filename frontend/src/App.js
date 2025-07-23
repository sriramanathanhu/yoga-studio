import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AdminAuthProvider, useAdminAuth } from './hooks/useAdminAuth';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Practice = lazy(() => import('./pages/Practice'));
const Profile = lazy(() => import('./pages/Profile'));
const AsanaLibrary = lazy(() => import('./pages/AsanaLibrary'));

// Admin components
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }
  
  if (!admin) {
    return <Navigate to="/admin/login" />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      {user && <Navbar />}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* User Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/practice" element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/asana-library" element={
            <ProtectedRoute>
              <AsanaLibrary />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="" element={<Navigate to="/admin/dashboard" />} />
          </Route>
          
          <Route path="/" element={
            user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;