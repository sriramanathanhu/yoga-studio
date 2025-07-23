import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  LockClosedIcon, 
  UserIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { admin, adminLogin, error, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (admin && !loading) {
      navigate('/admin/dashboard');
    }
  }, [admin, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await adminLogin(email, password);
    
    if (result.success) {
      navigate('/admin/dashboard');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (admin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple text-white">
            <ShieldCheckIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-purple focus:border-purple focus:z-10 sm:text-sm"
                  placeholder="Admin email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-purple focus:border-purple focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple hover:bg-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <LockClosedIcon className="h-5 w-5 text-purple-light group-hover:text-purple-lighter" />
                  </span>
                  Sign in to Admin Portal
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-purple hover:text-purple-dark"
            >
              ← Back to User Login
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Admin access only. Unauthorized access is prohibited.</p>
          <p className="mt-1">Default credentials: admin@yogastudio.ecitizen.media / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;