import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { 
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const AdminLayout = () => {
  const { admin, adminLogout, hasPermission } = useAdminAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: HomeIcon, 
      permission: 'analytics' 
    },
    { 
      name: 'User Management', 
      href: '/admin/users', 
      icon: UsersIcon, 
      permission: 'user_management' 
    },
    { 
      name: 'Analytics', 
      href: '/admin/analytics', 
      icon: ChartBarIcon, 
      permission: 'analytics' 
    },
    { 
      name: 'Admin Management', 
      href: '/admin/admins', 
      icon: ShieldCheckIcon, 
      permission: 'admin_management' 
    },
    { 
      name: 'System Settings', 
      href: '/admin/settings', 
      icon: CogIcon, 
      permission: 'system_settings' 
    },
  ];

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));

  const handleLogout = async () => {
    await adminLogout();
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold text-purple">🧘‍♀️ Admin Portal</h1>
          </div>
          
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-purple text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-14" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-purple">🧘‍♀️ Admin Portal</h1>
          </div>
          
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-purple text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {filteredNavigation.find(item => item.href === location.pathname)?.name || 'Admin Dashboard'}
              </h2>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-purple flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {admin?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{admin?.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{admin?.role?.replace('_', ' ')}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;