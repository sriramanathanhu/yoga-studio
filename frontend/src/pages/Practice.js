import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import AuthRequired from '../components/AuthRequired';
import SacredPreparation from '../components/SacredPreparation';
import { 
  PlayIcon, 
  PauseIcon, 
  ForwardIcon,
  BackwardIcon,
  CheckIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

const Practice = () => {
  const { user, loading: authLoading } = useAuth();
  const [routine, setRoutine] = useState(null);
  const [currentPose, setCurrentPose] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    generateRoutine();
  }, []);

  useEffect(() => {
    let interval;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleNextPose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  const generateRoutine = async () => {
    try {
      const response = await axios.post('/routines/generate');
      setRoutine(response.data);
      if (response.data.poses && response.data.poses.length > 0) {
        setTimeRemaining(response.data.poses[0].duration || 30);
      }
    } catch (error) {
      console.error('Failed to generate routine:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPose = () => {
    if (currentPose < routine.poses.length - 1) {
      const nextPose = currentPose + 1;
      setCurrentPose(nextPose);
      setTimeRemaining(routine.poses[nextPose].duration || 30);
    } else {
      completeSession();
    }
  };

  const handlePreviousPose = () => {
    if (currentPose > 0) {
      const prevPose = currentPose - 1;
      setCurrentPose(prevPose);
      setTimeRemaining(routine.poses[prevPose].duration || 30);
      setIsPlaying(false);
    }
  };

  const completeSession = async () => {
    try {
      await axios.post(`/routines/${routine.id}/complete`, {
        completed_poses: currentPose + 1,
        total_duration: routine.estimated_duration
      });
      setSessionComplete(true);
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle authentication loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // TEMPORARILY DISABLED: Redirect to authentication if not logged in
  // TODO: Re-enable authentication once auth issues are resolved
  // if (!user) {
  //   return <AuthRequired />;
  // }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized routine...</p>
          <p className="text-gray-500 text-sm mt-2">Creating practice from 507+ yoga poses...</p>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full text-center">
          <div className="card">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-primary mb-4">
              Session Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Great job! You've completed your yoga practice.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full btn-primary"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full btn-secondary"
              >
                Start New Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!routine || !routine.poses || routine.poses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to generate routine</p>
          <button onClick={generateRoutine} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentPoseData = routine.poses[currentPose];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Compact Sacred Header */}
        <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl shadow-lg text-white p-4 mb-4">
          <div className="flex items-center justify-between">
            {/* Left: Om symbol and title */}
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🕉️</div>
              <div>
                <h1 className="text-lg font-bold">
                  Nithyananda Yoga Sacred Practice
                </h1>
                <p className="text-orange-100 text-xs">
                  Sacred ritual - practice with devotion
                </p>
              </div>
            </div>
            
            {/* Right: Progress indicator */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold flex items-center">
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  {currentPose + 1} of {routine.poses.length}
                </div>
                <div className="text-orange-100 text-xs">
                  {Math.round(((currentPose + 1) / routine.poses.length) * 100)}% Complete
                </div>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle 
                    cx="32" cy="32" r="28" 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth="8" 
                    fill="none"
                  />
                  <circle 
                    cx="32" cy="32" r="28" 
                    stroke="white" 
                    strokeWidth="8" 
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - (currentPose + 1) / routine.poses.length)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {Math.round(((currentPose + 1) / routine.poses.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sacred Preparation Section - Collapsible */}
        <SacredPreparation asana={currentPoseData} />

        {/* Main Practice Area - Redesigned for Practice */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Asana Image and Sanskrit Name */}
          <div className="lg:col-span-1 space-y-4">
            {/* Asana Image */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center overflow-hidden">
                {currentPoseData.image_url ? (
                  <img 
                    src={currentPoseData.image_url} 
                    alt={currentPoseData.sanskrit_name || currentPoseData.english_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className="text-center" style={{ display: currentPoseData.image_url ? 'none' : 'block' }}>
                  <div className="text-6xl mb-4">🧘‍♀️</div>
                  <p className="text-orange-600">Sacred Pose Visualization</p>
                </div>
              </div>
            </div>

            {/* Sanskrit Name Display */}
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg text-white p-4 text-center">
              <div className="text-3xl mb-2">🕉️</div>
              <h1 className="text-xl font-bold mb-1">
                {currentPoseData.sanskrit_name || currentPoseData.english_name}
              </h1>
              {currentPoseData.sanskrit_name && (
                <p className="text-orange-100 text-sm">
                  {currentPoseData.english_name}
                </p>
              )}
            </div>
          </div>

          {/* Middle Column - Essential Practice Elements */}
          <div className="lg:col-span-1 space-y-4">
            {/* Instructions */}
            {currentPoseData.technique_instructions && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 text-lg">📋</div>
                  How to Practice
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  {currentPoseData.technique_instructions}
                </p>
              </div>
            )}

            {/* Pranayama */}
            <div className="bg-cyan-50 rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-cyan-800 mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 text-lg">🫁</div>
                Pranayama
              </h3>
              <p className="text-cyan-700 text-sm leading-relaxed">
                {currentPoseData.pranayama || currentPoseData.breathing_pattern || "Natural, steady breathing through the nose"}
              </p>
            </div>

            {/* Mudra */}
            <div className="bg-purple-50 rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 text-lg">🤲</div>
                Mudra
              </h3>
              <p className="text-purple-700 text-sm leading-relaxed">
                {currentPoseData.mudra || "Natural hand position supporting the pose"}
              </p>
            </div>

            {/* Bandha */}
            <div className="bg-indigo-50 rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-bold text-indigo-800 mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 text-lg">⚡</div>
                Bandha
              </h3>
              <p className="text-indigo-700 text-sm leading-relaxed">
                {currentPoseData.bandha || "Gentle Mula Bandha - subtle engagement of pelvic floor"}
              </p>
            </div>
          </div>

          {/* Right Column - Spiritual & Timer */}
          <div className="lg:col-span-1 space-y-4">
            {/* Sanskrit Verse - Only if available */}
            {(currentPoseData.sanskrit_verse || currentPoseData.sanskrit_mantra) && (
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg text-white p-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🕉️</div>
                  <h3 className="text-lg font-bold mb-2">Sacred Verse</h3>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-lg font-bold mb-1">
                      {currentPoseData.sanskrit_verse || currentPoseData.sanskrit_mantra}
                    </p>
                    {(currentPoseData.verse_translation || currentPoseData.mantra_translation) && (
                      <p className="text-orange-200 text-xs">
                        {currentPoseData.verse_translation || currentPoseData.mantra_translation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Japa - Only if available */}
            {(currentPoseData.japa || currentPoseData.sanskrit_mantra) && (
              <div className="bg-amber-50 rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-amber-800 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 text-lg">📿</div>
                  Japa
                </h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  {currentPoseData.japa || currentPoseData.sanskrit_mantra}
                </p>
              </div>
            )}

            {/* Visualization - Only if available */}
            {currentPoseData.visualization && (
              <div className="bg-violet-50 rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-violet-800 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 text-lg">🎨</div>
                  Visualization
                </h3>
                <p className="text-violet-700 text-sm leading-relaxed">
                  {currentPoseData.visualization}
                </p>
              </div>
            )}

            {/* Timer Controls */}
            <div className="bg-white rounded-xl shadow-lg p-4 text-center">
              <div className="text-4xl font-bold text-orange-600 mb-3">
                {formatTime(timeRemaining)}
              </div>
              <div className="flex justify-center space-x-3 mb-3">
                <button
                  onClick={handlePreviousPose}
                  disabled={currentPose === 0}
                  className="p-2 rounded-full bg-orange-200 hover:bg-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <BackwardIcon className="h-5 w-5 text-orange-600" />
                </button>
                
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg transition-all"
                >
                  {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                </button>
                
                <button
                  onClick={handleNextPose}
                  className="p-2 rounded-full bg-orange-200 hover:bg-orange-300 transition-colors"
                >
                  <ForwardIcon className="h-5 w-5 text-orange-600" />
                </button>
              </div>
              <p className="text-orange-600 text-xs font-medium">
                Sacred Practice Timer
              </p>
            </div>
          </div>
        </div>

        {/* Quick Complete Button */}
        <div className="mt-8 text-center">
          <button
            onClick={completeSession}
            className="btn-secondary"
          >
            <CheckIcon className="h-5 w-5 mr-2 inline" />
            Complete Session Early
          </button>
        </div>
      </div>
    </div>
  );
};

export default Practice;