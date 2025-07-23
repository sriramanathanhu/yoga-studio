import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const goals = [
  { id: 'stress_relief', name: 'Stress Relief', emoji: '😌', description: 'Calm your mind and relax' },
  { id: 'back_pain', name: 'Back Pain Relief', emoji: '🩹', description: 'Strengthen and heal your back' },
  { id: 'flexibility', name: 'Flexibility', emoji: '🤸‍♀️', description: 'Improve range of motion' },
  { id: 'energy', name: 'Energy Boost', emoji: '⚡', description: 'Energize your body and mind' },
  { id: 'sleep', name: 'Better Sleep', emoji: '😴', description: 'Improve sleep quality' },
  { id: 'muscle_toning', name: 'Muscle Toning', emoji: '💪', description: 'Build strength and definition' },
  { id: 'weight_loss', name: 'Weight Loss', emoji: '🏃‍♀️', description: 'Burn calories and boost metabolism' },
  { id: 'skill_improvement', name: 'Skill Development', emoji: '🎯', description: 'Master advanced poses' },
  { id: 'mental_clarity', name: 'Mental Clarity', emoji: '🧠', description: 'Enhance focus and concentration' }
];

const fitnessLevels = [
  { id: 'beginner', name: 'Beginner', description: 'New to yoga or exercise' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some yoga experience' },
  { id: 'advanced', name: 'Advanced', description: 'Regular yoga practice' }
];

const timePreferences = [15, 30, 45, 60];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [limitations, setLimitations] = useState('');
  const [timePreference, setTimePreference] = useState(30);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoalToggle = (goalId) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('/profile/setup', {
        goals: selectedGoals,
        fitness_level: fitnessLevel,
        physical_limitations: limitations,
        time_preference: timePreference
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">What are your yoga goals?</h2>
              <p className="text-gray-600">Select all that apply</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedGoals.includes(goal.id)
                      ? 'border-purple bg-purple/10'
                      : 'border-gray-200 hover:border-purple/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{goal.emoji}</div>
                  <h3 className="font-semibold text-primary">{goal.name}</h3>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">What's your fitness level?</h2>
              <p className="text-gray-600">Help us tailor your experience</p>
            </div>
            <div className="space-y-4">
              {fitnessLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setFitnessLevel(level.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    fitnessLevel === level.id
                      ? 'border-purple bg-purple/10'
                      : 'border-gray-200 hover:border-purple/50'
                  }`}
                >
                  <h3 className="font-semibold text-primary">{level.name}</h3>
                  <p className="text-gray-600">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Any physical limitations?</h2>
              <p className="text-gray-600">This helps us create safe routines for you</p>
            </div>
            <textarea
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder="e.g., knee injury, lower back pain, pregnancy, etc. (optional)"
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple h-32 resize-none"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">How long do you want to practice?</h2>
              <p className="text-gray-600">Choose your preferred session duration</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {timePreferences.map((time) => (
                <button
                  key={time}
                  onClick={() => setTimePreference(time)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    timePreference === time
                      ? 'border-purple bg-purple/10'
                      : 'border-gray-200 hover:border-purple/50'
                  }`}
                >
                  <div className="text-2xl font-bold text-primary">{time}</div>
                  <div className="text-sm text-gray-600">minutes</div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedGoals.length > 0;
      case 2: return fitnessLevel !== '';
      case 3: return true; // Optional step
      case 4: return timePreference > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {step} of 4</span>
            <span className="text-sm text-gray-600">{Math.round((step / 4) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {step === 4 ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;