import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AuthRequired = () => {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').charAt(0).toUpperCase() + 
                   location.pathname.slice(2);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full text-center p-8">
        <div className="card">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold text-primary mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access the {pageName} page and unlock all 507+ yoga poses with detailed instructions and images.
          </p>
          
          <div className="space-y-4">
            <Link 
              to={`/login?redirect=${location.pathname}`} 
              className="w-full btn-primary block text-center"
            >
              Sign In to Continue
            </Link>
            <Link 
              to={`/register?redirect=${location.pathname}`} 
              className="w-full btn-secondary block text-center"
            >
              Create Free Account
            </Link>
            <Link to="/" className="block text-purple hover:text-purple/80">
              ← Back to Home
            </Link>
          </div>

          {/* Benefits reminder */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-primary mb-2">What you'll get:</h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>✨ Access to 507+ detailed yoga poses</li>
              <li>🎯 Personalized practice recommendations</li>
              <li>📊 Progress tracking and analytics</li>
              <li>🧘‍♀️ Step-by-step instructions with images</li>
              <li>💪 Custom routines based on your goals</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRequired;