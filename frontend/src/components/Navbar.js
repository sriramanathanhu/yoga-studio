import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  HomeIcon, 
  UserIcon, 
  PlayIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { path: '/practice', icon: PlayIcon, label: 'Practice' },
    { path: '/asana-library', icon: BookOpenIcon, label: 'Asanas' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary">🧘‍♀️ Yoga AI</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple text-white'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-1" />
                  {item.label}
                </Link>
              );
            })}

            <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-700 mr-3">
                {user?.name || user?.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;