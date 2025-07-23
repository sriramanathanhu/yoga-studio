import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { 
  XMarkIcon, 
  CheckIcon,
  SparklesIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesData, setPreferencesData] = useState({
    goals: [],
    fitness_level: 'beginner',
    time_preference: 30,
    physical_limitations: ''
  });
  const [generatingRoutine, setGeneratingRoutine] = useState(false);

  // Available yoga goals
  const availableGoals = [
    { id: 'flexibility', label: 'Flexibility', icon: '🤸‍♀️', description: 'Improve range of motion and joint mobility' },
    { id: 'strength', label: 'Strength', icon: '💪', description: 'Build muscle strength and endurance' },
    { id: 'balance', label: 'Balance', icon: '⚖️', description: 'Enhance stability and coordination' },
    { id: 'relaxation', label: 'Relaxation', icon: '🧘‍♀️', description: 'Reduce stress and promote calm' },
    { id: 'focus', label: 'Focus', icon: '🎯', description: 'Improve concentration and mindfulness' },
    { id: 'energy', label: 'Energy', icon: '⚡', description: 'Boost vitality and alertness' },
    { id: 'healing', label: 'Healing', icon: '🌿', description: 'Support recovery and wellness' },
    { id: 'spiritual', label: 'Spiritual Growth', icon: '🕉️', description: 'Deepen spiritual practice and awareness' }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile/');
      setProfile(response.data);
      // Initialize preferences data
      setPreferencesData({
        goals: response.data.goals || [],
        fitness_level: response.data.fitness_level || 'beginner',
        time_preference: response.data.time_preference || 30,
        physical_limitations: response.data.physical_limitations || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      if (error.response?.status === 404) {
        // Profile doesn't exist yet
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      await axios.put('/api/profile/', profile);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile');
    }
  };

  const openPreferencesModal = () => {
    if (profile) {
      setPreferencesData({
        goals: profile.goals || [],
        fitness_level: profile.fitness_level || 'beginner',
        time_preference: profile.time_preference || 30,
        physical_limitations: profile.physical_limitations || ''
      });
    }
    setShowPreferencesModal(true);
  };

  const handleGoalToggle = (goalId) => {
    setPreferencesData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId) 
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const savePreferences = async () => {
    try {
      const response = await axios.put('/api/profile/', preferencesData);
      setProfile(response.data);
      setShowPreferencesModal(false);
      
      // Show success message and ask if they want to generate new routine
      const generateNew = window.confirm(
        'Preferences saved! Would you like to generate a new routine based on your updated goals?'
      );
      
      if (generateNew) {
        await generateNewRoutine();
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    }
  };

  const generateNewRoutine = async () => {
    try {
      setGeneratingRoutine(true);
      const response = await axios.post('/routines/generate');
      
      // Show success notification
      alert(`New routine generated! "${response.data.name}" is ready for practice.`);
      
    } catch (error) {
      console.error('Failed to generate routine:', error);
      alert('Failed to generate new routine. Please try again from the Practice tab.');
    } finally {
      setGeneratingRoutine(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-primary mb-4">User Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-900">{user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Yoga Preferences */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Yoga Preferences</h2>
            <button
              onClick={openPreferencesModal}
              className="btn-primary flex items-center"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Edit Goals
            </button>
          </div>

          {profile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Goals</label>
                <div className="flex flex-wrap gap-2">
                  {profile.goals && profile.goals.length > 0 ? (
                    profile.goals.map(goal => {
                      const goalInfo = availableGoals.find(g => g.id === goal);
                      return (
                        <span key={goal} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
                          <span className="mr-1">{goalInfo?.icon || '🎯'}</span>
                          {goalInfo?.label || goal}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500 italic">No goals set</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fitness Level</label>
                  <p className="text-gray-900 capitalize bg-gray-50 px-3 py-2 rounded-lg">{profile.fitness_level || 'Not set'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.time_preference || 30} minutes</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limitations</label>
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg text-sm">{profile.physical_limitations || 'None specified'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No preferences set yet</p>
              <button
                onClick={openPreferencesModal}
                className="btn-primary"
              >
                Set Your Yoga Goals
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Practice Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple">0</div>
            <div className="text-gray-600">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple">0</div>
            <div className="text-gray-600">Minutes Practiced</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple">0</div>
            <div className="text-gray-600">Current Streak</div>
          </div>
        </div>
      </div>

      {/* Yoga Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-primary flex items-center">
                  <SparklesIcon className="h-6 w-6 mr-2" />
                  Edit Yoga Preferences
                </h3>
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Goals Selection */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">What are your yoga goals? (Select multiple)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableGoals.map(goal => (
                    <div
                      key={goal.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        preferencesData.goals.includes(goal.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => handleGoalToggle(goal.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{goal.icon}</div>
                        <div>
                          <h5 className="font-medium text-gray-800">{goal.label}</h5>
                          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        </div>
                        {preferencesData.goals.includes(goal.id) && (
                          <CheckIcon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fitness Level */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3">Fitness Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['beginner', 'intermediate', 'advanced'].map(level => (
                    <button
                      key={level}
                      onClick={() => setPreferencesData(prev => ({...prev, fitness_level: level}))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        preferencesData.fitness_level === level
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {level === 'beginner' && '🌱'}
                          {level === 'intermediate' && '🌿'}
                          {level === 'advanced' && '🌳'}
                        </div>
                        <div className="font-medium capitalize">{level}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Preference */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3">Preferred Session Duration</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[15, 30, 45, 60].map(minutes => (
                    <button
                      key={minutes}
                      onClick={() => setPreferencesData(prev => ({...prev, time_preference: minutes}))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        preferencesData.time_preference === minutes
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">{minutes} min</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Limitations */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Physical Limitations or Injuries (Optional)
                </label>
                <textarea
                  value={preferencesData.physical_limitations}
                  onChange={(e) => setPreferencesData(prev => ({...prev, physical_limitations: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="e.g., knee injury, lower back pain, wrist issues..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={savePreferences}
                  disabled={preferencesData.goals.length === 0}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Save & Generate New Routine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for routine generation */}
      {generatingRoutine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center">
            <ArrowPathIcon className="h-12 w-12 animate-spin text-purple mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Generating Your New Routine
            </h3>
            <p className="text-gray-600">
              Creating personalized asana sequence based on your updated goals...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;