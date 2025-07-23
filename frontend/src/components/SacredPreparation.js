import React, { useState } from 'react';
import { 
  CheckIcon, 
  ExclamationTriangleIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

const SacredPreparation = ({ asana }) => {
  const [checkedItems, setCheckedItems] = useState({
    bath: false,
    bowelMovement: false,
    bhasma: false,
    aushadha: false,
    sriYantra: false,
    rudraksha: false
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCheck = (item) => {
    setCheckedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const allItemsChecked = Object.values(checkedItems).every(Boolean);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const preparationItems = [
    {
      id: 'bath',
      text: 'Complete bath with clean water',
      description: 'Purify your physical body before sacred practice',
      icon: '🚿'
    },
    {
      id: 'bowelMovement',
      text: 'Clear bowel movement (empty stomach)',
      description: 'Essential for internal cleanliness during asana practice',
      icon: '💚'
    },
    {
      id: 'bhasma',
      text: 'Apply Bhasma (Vibhuti) on forehead',
      description: asana?.bhasma || 'Sacred ash for spiritual purification',
      icon: '✨'
    },
    {
      id: 'aushadha',
      text: 'Prepare Aushadha (Sandalwood + Turmeric)',
      description: asana?.aushadha || 'Sacred paste for healing and purification',
      icon: '🟡'
    },
    {
      id: 'sriYantra',
      text: 'Place Sri Yantra nearby',
      description: asana?.sriyantra || 'Sacred geometry for divine energy connection',
      icon: '🔷'
    },
    {
      id: 'rudraksha',
      text: 'Wear/Hold Rudraksha Jewelery',
      description: asana?.rudraksha_jewelery || 'Sacred beads for spiritual protection',
      icon: '📿'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3 mb-4 shadow-sm">
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🕉️</div>
          <div>
            <h3 className="text-sm font-bold text-orange-800 flex items-center">
              <SparklesIcon className="h-4 w-4 mr-1" />
              Sacred Preparation ({checkedCount}/6)
            </h3>
            <p className="text-orange-600 text-xs">
              {allItemsChecked ? 'Ready for practice' : 'Ritual preparation needed'} • {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {allItemsChecked ? (
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
              ✓ Ready
            </div>
          ) : (
            <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
              ⚠️ Needed
            </div>
          )}
          <div className="text-orange-500 text-sm">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4">
          {/* Compact Important Message */}
          <div className="bg-orange-100 border-l-4 border-orange-400 p-3 mb-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-orange-700 text-sm">
                  🙏 Sacred ritual - complete all items before practice (like Puja preparation)
                </p>
              </div>
            </div>
          </div>

          {/* Compact Preparation Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {preparationItems.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-2 transition-all cursor-pointer ${
                  checkedItems[item.id]
                    ? 'border-green-300 bg-green-50'
                    : 'border-orange-200 bg-white hover:border-orange-300'
                }`}
                onClick={() => handleCheck(item.id)}
                title={item.description}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    {checkedItems[item.id] ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-orange-300 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h5 className={`text-xs font-medium truncate ${
                      checkedItems[item.id] ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      {item.text}
                    </h5>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compact Action Buttons */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => {
                const allChecked = Object.keys(checkedItems).reduce((acc, key) => {
                  acc[key] = true;
                  return acc;
                }, {});
                setCheckedItems(allChecked);
              }}
              className="text-orange-600 hover:text-orange-800 text-xs font-medium flex items-center"
            >
              ✓ Mark All Complete
            </button>
            
            {allItemsChecked && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full flex items-center space-x-1 shadow-md">
                <SparklesIcon className="h-4 w-4" />
                <span className="text-xs font-medium">Ready for Sacred Practice</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SacredPreparation;