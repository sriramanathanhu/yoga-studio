import React, { useState } from 'react';
import { 
  XMarkIcon,
  ClockIcon,
  StarIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  EyeIcon,
  HandRaisedIcon,
  BoltIcon,
  LightBulbIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Enhanced asana image placeholder for modal view
const AsanaImagePlaceholder = ({ asana, isModal = false }) => {
  const getPoseEmoji = (name) => {
    const nameKey = (name || '').toLowerCase();
    if (nameKey.includes('tree') || nameKey.includes('vrksasana')) return '🌳';
    if (nameKey.includes('warrior') || nameKey.includes('virabhadrasana')) return '⚔️';
    if (nameKey.includes('downward') || nameKey.includes('adho')) return '🐕';
    if (nameKey.includes('child') || nameKey.includes('balasana')) return '🤱';
    if (nameKey.includes('triangle') || nameKey.includes('trikonasana')) return '📐';
    if (nameKey.includes('cobra') || nameKey.includes('bhujangasana')) return '🐍';
    if (nameKey.includes('lotus') || nameKey.includes('padmasana')) return '🪷';
    if (nameKey.includes('sun') || nameKey.includes('surya')) return '☀️';
    if (nameKey.includes('moon') || nameKey.includes('chandra')) return '🌙';
    if (nameKey.includes('eagle') || nameKey.includes('garudasana')) return '🦅';
    if (nameKey.includes('fish') || nameKey.includes('matsyasana')) return '🐟';
    if (nameKey.includes('camel') || nameKey.includes('ustrasana')) return '🐪';
    if (nameKey.includes('bridge') || nameKey.includes('setu')) return '🌉';
    if (nameKey.includes('mountain') || nameKey.includes('tadasana')) return '⛰️';
    if (nameKey.includes('cat') || nameKey.includes('marjary')) return '🐱';
    if (nameKey.includes('cow') || nameKey.includes('bitilasana')) return '🐄';
    return '🧘‍♀️';
  };

  const difficultyColor = {
    'beginner': 'from-green-100 to-green-200 text-green-800',
    'intermediate': 'from-yellow-100 to-yellow-200 text-yellow-800', 
    'advanced': 'from-red-100 to-red-200 text-red-800'
  };

  const bgColor = difficultyColor[asana.difficulty_level] || 'from-purple-100 to-indigo-200 text-purple-800';
  const emojiSize = isModal ? 'text-8xl mb-6' : 'text-5xl mb-3';
  const titleSize = isModal ? 'text-2xl font-bold mb-3' : 'text-sm font-semibold mb-1 line-clamp-2';
  const detailSize = isModal ? 'text-lg' : 'text-xs';

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${bgColor} p-6`}>
      <div className={emojiSize}>{getPoseEmoji(asana.sanskrit_name || asana.english_name)}</div>
      <p className={`text-center ${titleSize}`}>
        {asana.sanskrit_name || asana.english_name}
      </p>
      <div className={`${detailSize} opacity-80 capitalize text-center`}>
        <div className="mb-2">{asana.difficulty_level || 'beginner'} level</div>
        <div>{asana.time_minutes || 2} minutes duration</div>
        {isModal && asana.benefits && (
          <div className="mt-4 text-sm max-w-md text-center">
            <p className="font-semibold mb-2">Key Benefits:</p>
            <p className="opacity-90">{asana.benefits.substring(0, 150)}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AsanaDetailModal = ({ asana, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!asana) return null;

  const components = [
    {
      id: 'description',
      title: 'Description',
      icon: InformationCircleIcon,
      content: asana.description,
      color: 'blue'
    },
    {
      id: 'technique_instructions',
      title: 'Technique & Instructions',
      icon: AdjustmentsHorizontalIcon,
      content: asana.technique_instructions,
      color: 'green'
    },
    {
      id: 'alignment_cues',
      title: 'Alignment Cues',
      icon: AdjustmentsHorizontalIcon,
      content: asana.alignment_cues,
      color: 'purple'
    },
    {
      id: 'breathing_pattern',
      title: 'Breathing Pattern',
      icon: ArrowPathIcon,
      content: asana.breathing_pattern,
      color: 'cyan'
    },
    {
      id: 'bandha',
      title: 'Bandha (Energy Locks)',
      icon: BoltIcon,
      content: asana.bandha,
      color: 'yellow'
    },
    {
      id: 'mudra',
      title: 'Mudra (Hand Gestures)',
      icon: HandRaisedIcon,
      content: asana.mudra,
      color: 'pink'
    },
    {
      id: 'drishti',
      title: 'Drishti (Gaze Points)',
      icon: EyeIcon,
      content: asana.drishti,
      color: 'indigo'
    },
    {
      id: 'benefits',
      title: 'Benefits',
      icon: HeartIcon,
      content: asana.benefits,
      color: 'emerald'
    },
    {
      id: 'practice_tips',
      title: 'Practice Tips',
      icon: LightBulbIcon,
      content: asana.practice_tips,
      color: 'orange'
    },
    {
      id: 'visualization',
      title: 'Visualization',
      icon: EyeIcon,
      content: asana.visualization,
      color: 'violet'
    },
    {
      id: 'contraindications',
      title: 'Contraindications',
      icon: ExclamationTriangleIcon,
      content: asana.contraindications,
      color: 'red'
    },
    {
      id: 'goal_tags',
      title: 'Goal Tags',
      icon: StarIcon,
      content: asana.goal_tags,
      color: 'teal'
    }
  ];

  const renderComponent = (component) => {
    if (!component.content) return null;

    const Icon = component.icon;
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      pink: 'text-pink-600 bg-pink-50 border-pink-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      violet: 'text-violet-600 bg-violet-50 border-violet-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      teal: 'text-teal-600 bg-teal-50 border-teal-200'
    };

    return (
      <div key={component.id} className={`p-6 rounded-xl border-2 ${colorClasses[component.color]} transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-lg bg-white shadow-sm mr-3`}>
            <Icon className={`h-6 w-6 ${colorClasses[component.color].split(' ')[0]}`} />
          </div>
          <h3 className={`text-lg font-semibold ${colorClasses[component.color].split(' ')[0]}`}>
            {component.title}
          </h3>
        </div>
        
        <div className="text-gray-700 leading-relaxed">
          {component.id === 'goal_tags' && Array.isArray(component.content) ? (
            <div className="flex flex-wrap gap-2">
              {component.content.map((tag, index) => (
                <span 
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses[component.color]}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-line">{component.content}</p>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
    { id: 'technique', label: 'Technique', icon: AdjustmentsHorizontalIcon },
    { id: 'details', label: 'Details', icon: StarIcon }
  ];

  const getTabComponents = (tabId) => {
    switch (tabId) {
      case 'overview':
        return components.filter(c => ['description', 'benefits', 'contraindications', 'goal_tags'].includes(c.id));
      case 'technique':
        return components.filter(c => ['technique_instructions', 'alignment_cues', 'breathing_pattern', 'practice_tips'].includes(c.id));
      case 'details':
        return components.filter(c => ['bandha', 'mudra', 'drishti', 'visualization'].includes(c.id));
      default:
        return components;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div 
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Sanskrit as Primary, English as Secondary */}
              <h1 className="text-3xl font-bold mb-2">
                {asana.sanskrit_name || asana.english_name}
              </h1>
              {asana.sanskrit_name && (
                <h2 className="text-xl text-purple-100 mb-4">
                  {asana.english_name}
                </h2>
              )}
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>{asana.time_minutes} minutes</span>
                </div>
                <div className="flex items-center">
                  <StarIcon className="h-5 w-5 mr-2" />
                  <span className="capitalize">{asana.difficulty_level}</span>
                </div>
                {asana.sequence_stage && (
                  <div className="flex items-center">
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    <span className="capitalize">{asana.sequence_stage}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={onClose}
                className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white flex items-center space-x-2"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
                <span className="font-semibold">Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Image Section - Visual Representation */}
        <div className="h-80 bg-gradient-to-br from-purple-50 to-indigo-50 relative">
          {asana.image_url ? (
            <img 
              src={asana.image_url} 
              alt={asana.sanskrit_name || asana.english_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('❌ Modal image failed to load:', asana.english_name, asana.image_url, e);
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
              onLoad={() => {
                console.log('✅ Modal image loaded successfully:', asana.english_name);
              }}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className={asana.image_url ? 'hidden' : 'block'}>
            <AsanaImagePlaceholder asana={asana} isModal={true} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-96 p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {getTabComponents(activeTab).map(component => renderComponent(component))}
          </div>
          
          {getTabComponents(activeTab).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <InformationCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No content available for this section</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsanaDetailModal;