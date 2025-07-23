import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClockIcon, 
  StarIcon, 
  PlayCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

const RoutineSuggestion = ({ className = "" }) => {
  const [availableTime, setAvailableTime] = useState(15);
  const [difficulty, setDifficulty] = useState('beginner');
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuggestion();
  }, [availableTime, difficulty]);

  const fetchSuggestion = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/asanas/routine-suggestions', {
        params: {
          available_time: availableTime,
          difficulty: difficulty
        }
      });
      setSuggestion(response.data);
    } catch (error) {
      console.error('Failed to fetch routine suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' }
  ];

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', color: 'text-green-600 bg-green-50' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'advanced', label: 'Advanced', color: 'text-red-600 bg-red-50' }
  ];

  return (
    <div className={`card ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-primary mb-2 flex items-center">
          <ClockIcon className="h-6 w-6 mr-2" />
          Personalized Routine Suggestion
        </h3>
        <p className="text-gray-600">
          Get a customized yoga routine based on your available time and skill level
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Time
          </label>
          <select
            value={availableTime}
            onChange={(e) => setAvailableTime(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple focus:border-transparent"
          >
            {timeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple focus:border-transparent"
          >
            {difficultyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggestion Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple mx-auto mb-4"></div>
          <p className="text-gray-600">Creating your personalized routine...</p>
        </div>
      ) : suggestion ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-purple-800">
                Recommended Routine
              </h4>
              <div className="flex items-center text-purple-600">
                <StarIcon className="h-5 w-5 mr-1" />
                <span className="capitalize">{difficulty}</span>
              </div>
            </div>
            
            <p className="text-purple-700 mb-4">{suggestion.recommendation}</p>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-800">
                  {suggestion.total_asanas}
                </div>
                <div className="text-sm text-purple-600">Asanas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-800">
                  {suggestion.suggested_duration}
                </div>
                <div className="text-sm text-purple-600">Minutes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-800">
                  {Math.round((suggestion.suggested_duration / suggestion.available_time) * 100)}%
                </div>
                <div className="text-sm text-purple-600">Time Used</div>
              </div>
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Session Breakdown
            </h5>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Warm-up</div>
                <div className="text-gray-600">{suggestion.time_breakdown.warmup_time} min</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Main Practice</div>
                <div className="text-gray-600">{suggestion.time_breakdown.main_time} min</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Cool-down</div>
                <div className="text-gray-600">{suggestion.time_breakdown.cooldown_time} min</div>
              </div>
            </div>
          </div>

          {/* Routine Poses */}
          {suggestion.routine_poses && suggestion.routine_poses.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-800 mb-3">
                Suggested Poses
              </h5>
              <div className="space-y-2">
                {suggestion.routine_poses.map((pose, index) => (
                  <div 
                    key={pose.id} 
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {pose.sanskrit_name || pose.english_name}
                        </div>
                        {pose.sanskrit_name && (
                          <div className="text-sm text-gray-600">
                            {pose.english_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        {pose.duration_minutes} min
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {pose.sequence_stage}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="text-center pt-4">
            <button className="btn-primary flex items-center mx-auto">
              <PlayCircleIcon className="h-5 w-5 mr-2" />
              Start This Routine
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select your preferences to get a personalized routine</p>
        </div>
      )}
    </div>
  );
};

export default RoutineSuggestion;