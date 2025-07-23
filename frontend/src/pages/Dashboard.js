import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  PlayIcon, 
  ClockIcon, 
  TrophyIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRoutines, setRecentRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsResponse, routinesResponse] = await Promise.all([
        axios.get('/dashboard/stats').catch(err => {
          console.warn('Stats API failed:', err);
          return { data: { total_sessions: 0, total_minutes: 0, current_streak: 0 } };
        }),
        axios.get('/routines/recent').catch(err => {
          console.warn('Recent routines API failed:', err);
          return { data: [] };
        })
      ]);
      
      setStats(statsResponse.data);
      setRecentRoutines(routinesResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      // Set default data so dashboard still shows
      setStats({ total_sessions: 0, total_minutes: 0, current_streak: 0 });
      setRecentRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="ml-4 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 inline mr-1" />
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Welcome back, {user?.name || 'Yogi'}! 🙏
          </h1>
          <p className="text-lg text-gray-600">Ready for your next practice session?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/practice" className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-purple text-white p-4 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                <PlayIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-1">Start Practice</h3>
                <p className="text-gray-600">Begin personalized session</p>
              </div>
            </div>
          </Link>

          <Link to="/asana-library" className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-secondary text-white p-4 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-1">Explore Poses</h3>
                <p className="text-gray-600">Browse asana library</p>
              </div>
            </div>
          </Link>

          <div className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center">
              <div className="bg-accent text-primary p-4 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                <ClockIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-1">Quick Session</h3>
                <p className="text-gray-600">15-minute energizer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="bg-green-600 text-white p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <TrophyIcon className="h-10 w-10" />
            </div>
            <h3 className="text-3xl font-bold text-primary mb-2">
              {stats?.total_sessions || 0}
            </h3>
            <p className="text-gray-600 font-medium">Total Sessions</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats?.total_sessions || 0) * 10, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="bg-blue-600 text-white p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-10 w-10" />
            </div>
            <h3 className="text-3xl font-bold text-primary mb-2">
              {stats?.total_minutes || 0}
            </h3>
            <p className="text-gray-600 font-medium">Minutes Practiced</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats?.total_minutes || 0) / 10, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="bg-purple text-white p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-10 w-10" />
            </div>
            <h3 className="text-3xl font-bold text-primary mb-2">
              {stats?.current_streak || 0}
            </h3>
            <p className="text-gray-600 font-medium">Day Streak</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats?.current_streak || 0) * 20, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-2xl font-semibold text-primary mb-6">Recent Sessions</h3>
          {recentRoutines.length > 0 ? (
            <div className="space-y-4">
              {recentRoutines.map((routine, index) => (
                <div key={index} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:shadow-md transition-all">
                  <div className="flex items-center">
                    <div className="bg-purple text-white p-3 rounded-lg mr-4">
                      <PlayIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary text-lg">{routine.name}</h4>
                      <p className="text-sm text-gray-600">
                        {routine.duration} minutes • {new Date(routine.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-yellow-500">
                      ⭐ {routine.rating || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-purple/10 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <PlayIcon className="h-12 w-12 text-purple" />
              </div>
              <h4 className="text-xl font-semibold text-primary mb-2">Ready to begin?</h4>
              <p className="text-gray-600 mb-6">Start your yoga journey with your first practice session!</p>
              <Link to="/practice" className="bg-purple hover:bg-purple/90 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:-translate-y-1">
                Begin Practice
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;