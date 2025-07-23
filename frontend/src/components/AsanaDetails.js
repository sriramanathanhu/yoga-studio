import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  BoltIcon,
  EyeIcon,
  HeartIcon,
  SparklesIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const AsanaDetails = ({ asana }) => {
  const [activeTab, setActiveTab] = useState('essential');
  
  // Debug: Log the asana data to see what's available
  React.useEffect(() => {
    console.log('AsanaDetails received data:', asana);
    console.log('Available fields:', Object.keys(asana || {}));
  }, [asana]);

  const tabs = [
    { 
      id: 'essential', 
      label: 'Essential Practice', 
      icon: DocumentTextIcon,
      color: 'blue'
    },
    { 
      id: 'energy', 
      label: 'Energy Work', 
      icon: BoltIcon,
      color: 'purple'
    },
    { 
      id: 'spiritual', 
      label: 'Spiritual Aspects', 
      icon: SparklesIcon,
      color: 'indigo'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'essential':
        return (
          <div className="space-y-6">
            {/* Technique Instructions */}
            {asana.technique_instructions && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Step-by-Step Technique
                </h4>
                <div className="text-blue-700 leading-relaxed whitespace-pre-line">
                  {asana.technique_instructions}
                </div>
              </div>
            )}

            {/* Pranayama - Always Show */}
            <div className="bg-cyan-50 border-l-4 border-cyan-400 p-4 rounded-r-lg">
              <h4 className="font-semibold text-cyan-800 mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 text-lg">🫁</div>
                Pranayama (Breathing)
              </h4>
              <p className="text-cyan-700 leading-relaxed">
                {asana.pranayama || asana.breathing_pattern || "Ujjayi Pranayama - Deep, steady breathing through nose with gentle throat constriction"}
              </p>
            </div>

            {/* Alignment Cues */}
            {asana.alignment_cues && (
              <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
                <h4 className="font-semibold text-emerald-800 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 text-lg">📐</div>
                  Alignment Cues
                </h4>
                <p className="text-emerald-700 leading-relaxed">
                  {asana.alignment_cues}
                </p>
              </div>
            )}

            {/* Duration */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 text-lg">⏱️</div>
                Practice Duration
              </h4>
              <p className="text-orange-700">
                Hold this pose for <span className="font-semibold">{Math.floor(asana.duration / 60)} minutes</span> with steady breathing.
              </p>
            </div>
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-6">
            {/* Mudra - Always Show */}
            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 text-lg">🤲</div>
                Mudra (Hand Position)
              </h4>
              <p className="text-purple-700 leading-relaxed">
                {asana.mudra || "Anjali Mudra (Prayer position) - Palms together at heart center, invoking divine presence and respect"}
              </p>
            </div>

            {/* Bandha - Always Show */}
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
              <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
                <BoltIcon className="h-5 w-5 mr-2" />
                Bandha (Energy Locks)
              </h4>
              <p className="text-indigo-700 leading-relaxed">
                {asana.bandha || "Mula Bandha - Gentle engagement of pelvic floor muscles to contain and direct pranic energy upward"}
              </p>
            </div>

            {/* Drishti - Always Show */}
            <div className="bg-rose-50 border-l-4 border-rose-400 p-4 rounded-r-lg">
              <h4 className="font-semibold text-rose-800 mb-2 flex items-center">
                <EyeIcon className="h-5 w-5 mr-2" />
                Drishti (Gaze Focus)
              </h4>
              <p className="text-rose-700 leading-relaxed">
                {asana.drishti || "Nasagrai Drishti - Soft gaze toward the tip of the nose to enhance concentration and inner awareness"}
              </p>
            </div>

            {/* Pranayama - Always Show */}
            <div className="bg-cyan-50 border-l-4 border-cyan-400 p-4 rounded-r-lg">
              <h4 className="font-semibold text-cyan-800 mb-2 flex items-center">
                <div className="w-5 h-5 mr-2 text-lg">🫁</div>
                Pranayama (Sacred Breathing)
              </h4>
              <p className="text-cyan-700 leading-relaxed">
                {asana.pranayama || asana.breathing_pattern || "Ujjayi Pranayama - Deep, rhythmic breathing through the nose with slight throat constriction creating oceanic sound"}
              </p>
            </div>

            {/* Japa - Only Show If Available */}
            {(asana.japa || asana.sanskrit_mantra) && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 text-lg">📿</div>
                  Japa (Mantra Repetition)
                </h4>
                <p className="text-amber-700 leading-relaxed">
                  {asana.japa || asana.sanskrit_mantra}
                </p>
              </div>
            )}

            {/* Energy Work Message */}
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <BoltIcon className="h-6 w-6 text-purple-600" />
                <h4 className="font-semibold text-purple-800">Energy Integration</h4>
              </div>
              <p className="text-purple-700 text-sm leading-relaxed">
                These energy practices enhance the spiritual dimension of your asana. Practice them mindfully 
                to channel divine energy through your body.
              </p>
            </div>
          </div>
        );

      case 'spiritual':
        return (
          <div className="space-y-6">
            {/* Mantra/Japa */}
            {(asana.japa || asana.sanskrit_mantra) && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 text-lg">🕉️</div>
                  Mantra/Japa
                </h4>
                <div className="space-y-2">
                  {asana.sanskrit_mantra && (
                    <p className="text-orange-700 font-semibold">
                      {asana.sanskrit_mantra}
                    </p>
                  )}
                  {asana.mantra_transliteration && (
                    <p className="text-orange-600 italic">
                      {asana.mantra_transliteration}
                    </p>
                  )}
                  {asana.mantra_translation && (
                    <p className="text-orange-700 text-sm">
                      Translation: {asana.mantra_translation}
                    </p>
                  )}
                  {asana.japa && !asana.sanskrit_mantra && (
                    <p className="text-orange-700">
                      {asana.japa}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Visualization */}
            {asana.visualization && (
              <div className="bg-violet-50 border-l-4 border-violet-400 p-4 rounded-r-lg">
                <h4 className="font-semibold text-violet-800 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 text-lg">🎨</div>
                  Visualization
                </h4>
                <p className="text-violet-700 leading-relaxed">
                  {asana.visualization}
                </p>
              </div>
            )}

            {/* Benefits */}
            {asana.benefits && (
              <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
                <h4 className="font-semibold text-emerald-800 mb-2 flex items-center">
                  <HeartIcon className="h-5 w-5 mr-2" />
                  Sacred Benefits
                </h4>
                <p className="text-emerald-700 leading-relaxed">
                  {asana.benefits}
                </p>
              </div>
            )}

            {/* Spiritual Message */}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg border border-indigo-200">
              <div className="flex items-center space-x-2 mb-2">
                <SparklesIcon className="h-6 w-6 text-indigo-600" />
                <h4 className="font-semibold text-indigo-800">Divine Connection</h4>
              </div>
              <p className="text-indigo-700 text-sm leading-relaxed">
                Through mantra, visualization, and focused intention, transform this physical practice 
                into a sacred communion with the divine consciousness within.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sanskrit Mantra Card - Always Prominent */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg text-white p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🕉️</div>
          <h3 className="text-2xl font-bold mb-4">Sanskrit Verse</h3>
          
          {/* Sanskrit Verse - Only Show If Available */}
          {(asana?.sanskrit_verse || asana?.sanskrit_mantra) ? (
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-4">
                {/* Sanskrit Verse (Primary) or Sanskrit Mantra (Fallback) */}
                <p className="text-2xl font-bold mb-2">
                  {asana.sanskrit_verse || asana.sanskrit_mantra}
                </p>
                {/* Transliteration (only if available) */}
                {asana.mantra_transliteration && (
                  <p className="text-orange-100 text-lg italic">
                    {asana.mantra_transliteration}
                  </p>
                )}
                {/* Translation (only if available) */}
                {(asana.verse_translation || asana.mantra_translation) && (
                  <p className="text-orange-200 text-sm mt-2">
                    {asana.verse_translation || asana.mantra_translation}
                  </p>
                )}
              </div>
              
              {/* Pramana Source */}
              {asana.pramana_source && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/20">
                  <p className="text-orange-100 text-sm">
                    <span className="font-semibold">🔖 Pramana Source:</span> {asana.pramana_source}
                  </p>
                </div>
              )}
              
              <p className="text-orange-100 text-sm">
                Sacred verse specific to this asana from ancient yoga texts
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-orange-200 text-lg italic">
                  🕉️ Sacred Practice - Focus on Breath and Intention
                </p>
              </div>
              <p className="text-orange-100 text-sm">
                Practice with devotion and mindfulness
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? `border-${tab.color}-500 text-${tab.color}-600`
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

      {/* Tab Content */}
      <div className="p-6">
        {renderContent()}
      </div>
      </div>
    </div>
  );
};

export default AsanaDetails;