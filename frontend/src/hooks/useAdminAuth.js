import { useState, useEffect, useContext, createContext } from 'react';

const AdminAuthContext = createContext({});

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Check if admin is authenticated on mount
  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const adminData = await response.json();
        setAdmin(adminData);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      console.error('Admin auth check failed:', err);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdmin(data.admin);
        return { success: true, admin: data.admin };
      } else {
        setError(data.detail || 'Login failed');
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (err) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setAdmin(null);
    }
  };

  const hasPermission = (permission) => {
    if (!admin) return false;
    
    const permissions = {
      'super_admin': [
        'user_management', 'admin_management', 'system_settings', 
        'analytics', 'content_management', 'all_permissions'
      ],
      'moderator': [
        'user_management', 'content_management', 'analytics'
      ],
      'analyst': [
        'analytics', 'view_users'
      ]
    };
    
    const adminPermissions = permissions[admin.role] || [];
    return adminPermissions.includes(permission) || adminPermissions.includes('all_permissions');
  };

  const hasRole = (role) => {
    if (!admin) return false;
    return admin.role === role || admin.role === 'super_admin';
  };

  const value = {
    admin,
    loading,
    error,
    adminLogin,
    adminLogout,
    hasPermission,
    hasRole,
    checkAdminAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};