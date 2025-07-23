import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserPlusIcon, 
  ChartBarIcon, 
  PlayIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to load dashboard statistics');
      }
    } catch (err) {
      setError('Network error loading statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">{error}</div>
        <button
          onClick={fetchDashboardStats}
          className="mt-2 text-sm text-red-600 hover:text-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.total_users || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: null,
    },
    {
      name: 'New Users Today',
      value: stats?.new_users_today || 0,
      icon: UserPlusIcon,
      color: 'bg-green-500',
      change: null,
    },
    {
      name: 'Active Users Today',
      value: stats?.active_users_today || 0,
      icon: ChartBarIcon,
      color: 'bg-purple',
      change: null,
    },
    {
      name: 'Sessions Today',
      value: stats?.total_sessions_today || 0,
      icon: PlayIcon,
      color: 'bg-indigo-500',
      change: null,
    },
    {
      name: 'Routines Completed',
      value: stats?.total_routines_completed_today || 0,
      icon: StarIcon,
      color: 'bg-yellow-500',
      change: null,
    },
    {
      name: 'Avg Session Time',
      value: `${Math.round(stats?.avg_session_duration || 0)}m`,
      icon: ClockIcon,
      color: 'bg-pink-500',
      change: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Welcome to Admin Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitor your yoga platform's performance and user engagement
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={fetchDashboardStats}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple hover:bg-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${item.color} rounded-md p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {item.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              {item.change && (
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className={`font-medium ${
                      item.change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.change.value}
                    </span>
                    <span className="text-gray-500"> from yesterday</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Popular Asanas */}
      {stats?.popular_asanas && stats.popular_asanas.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Popular Asanas Today
            </h3>
            <div className="mt-5">
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {stats.popular_asanas.slice(0, 5).map((asana, index) => (
                    <li key={index} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-purple rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {asana.english_name || asana.sanskrit_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {asana.usage_count} users practiced today
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="relative block w-full bg-gray-50 border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple">
              <UsersIcon className="mx-auto h-6 w-6 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                View All Users
              </span>
            </button>
            
            <button className="relative block w-full bg-gray-50 border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple">
              <ChartBarIcon className="mx-auto h-6 w-6 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                View Analytics
              </span>
            </button>
            
            <button className="relative block w-full bg-gray-50 border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple">
              <UserPlusIcon className="mx-auto h-6 w-6 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Add Admin User
              </span>
            </button>
            
            <button className="relative block w-full bg-gray-50 border border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple">
              <StarIcon className="mx-auto h-6 w-6 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                System Settings
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            System Status
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">API Status</h4>
                  <p className="text-sm text-green-600">All systems operational</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">Database</h4>
                  <p className="text-sm text-green-600">Connected and healthy</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">Storage</h4>
                  <p className="text-sm text-green-600">85% available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;