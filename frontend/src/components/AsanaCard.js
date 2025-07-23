import React, { useState, memo } from 'react';

// Comprehensive asana image placeholder component
const AsanaImagePlaceholder = ({ asana }) => {
  // Get a consistent yoga pose emoji based on asana name
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
    return '🧘‍♀️'; // Default yoga pose
  };

  const difficultyColor = {
    'beginner': 'from-green-100 to-green-200 text-green-700',
    'intermediate': 'from-yellow-100 to-yellow-200 text-yellow-700', 
    'advanced': 'from-red-100 to-red-200 text-red-700'
  };

  const bgColor = difficultyColor[asana.difficulty_level] || 'from-purple-100 to-indigo-100 text-purple-700';

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${bgColor} p-4`}>
      <div className="text-5xl mb-3">{getPoseEmoji(asana.sanskrit_name || asana.english_name)}</div>
      <p className="text-center text-sm font-semibold mb-1 line-clamp-2">
        {asana.sanskrit_name || asana.english_name}
      </p>
      <div className="text-xs opacity-75 capitalize">
        {asana.difficulty_level || 'beginner'} • {asana.time_minutes || 2} min
      </div>
    </div>
  );
};

const AsanaCard = ({ asana, onClick, showImage = true, className = "" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Validate required props
  if (!asana) {
    return null;
  }
  return (
    <div 
      className={`card hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={() => onClick?.(asana)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(asana)}
      aria-label={`View ${asana.sanskrit_name || asana.english_name} pose details`}
    >
      {showImage && (
        <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg overflow-hidden mb-4 relative">
          {asana.image_url && !imageError ? (
            <>
              <img 
                src={asana.image_url} 
                alt={asana.sanskrit_name || asana.english_name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', asana.english_name);
                  setImageLoaded(true);
                }}
                onError={(e) => {
                  console.log('❌ Image failed to load:', asana.english_name, asana.image_url, e);
                  setImageError(true);
                }}
                loading="lazy"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              )}
            </>
          ) : (
            <AsanaImagePlaceholder asana={asana} />
          )}
        </div>
      )}
      
      <div>
        {/* Sanskrit as Primary, English as Secondary */}
        <h3 className="text-lg font-semibold text-primary mb-1">
          {asana.sanskrit_name || asana.english_name}
        </h3>
        
        {asana.sanskrit_name && (
          <p className="text-secondary text-sm italic mb-2">
            {asana.english_name}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="capitalize bg-gray-100 px-2 py-1 rounded">
            {asana.difficulty_level || 'Beginner'}
          </span>
          {asana.time_minutes && (
            <span>{asana.time_minutes} min</span>
          )}
        </div>
        
        {asana.description && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
            {asana.description.substring(0, 150)}
            {asana.description.length > 150 ? '...' : ''}
          </p>
        )}
        
        {asana.benefits && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 font-medium mb-1">Benefits:</p>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {asana.benefits.substring(0, 100)}
              {asana.benefits.length > 100 ? '...' : ''}
            </p>
          </div>
        )}
        
        {asana.goal_tags && asana.goal_tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {asana.goal_tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="text-xs bg-purple/10 text-purple px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {asana.goal_tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{asana.goal_tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(AsanaCard, (prevProps, nextProps) => {
  return (
    prevProps.asana?.id === nextProps.asana?.id &&
    prevProps.showImage === nextProps.showImage &&
    prevProps.className === nextProps.className
  );
});