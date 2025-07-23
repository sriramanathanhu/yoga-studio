import React, { memo } from 'react';

const LoadingSpinner = ({ message = "Loading...", size = "large", fullScreen = true }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8", 
    large: "h-12 w-12"
  };
  
  const containerClasses = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-background"
    : "flex items-center justify-center p-4";
  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-purple mx-auto mb-4`} aria-label="Loading"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default memo(LoadingSpinner);