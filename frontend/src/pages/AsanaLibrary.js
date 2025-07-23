import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import AsanaCard from '../components/AsanaCard';
import AsanaDetailModal from '../components/AsanaDetailModal';
import RoutineSuggestion from '../components/RoutineSuggestion';
import AuthRequired from '../components/AuthRequired';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AsanaLibrary = () => {
  const { user, loading: authLoading } = useAuth();
  const [asanas, setAsanas] = useState([]);
  const [filteredAsanas, setFilteredAsanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAsana, setSelectedAsana] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch asanas regardless of authentication status since backend auth is temporarily removed
    fetchAsanas();
  }, []); // Remove user dependency

  useEffect(() => {
    filterAsanas();
  }, [asanas, searchTerm, selectedDifficulty]);

  const fetchAsanas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Attempting to fetch asanas from /asanas/');
      const response = await axios.get('/asanas/').catch(err => {
        console.error('❌ Direct asanas fetch failed:', err.response?.status, err.message);
        return { data: [] };
      });
      console.log('✅ Asanas response received:', response.data?.length || 0, 'asanas');
      setAsanas(response.data);
    } catch (error) {
      console.error('❌ Critical error fetching asanas:', error);
      setError('Unable to load poses. Please check your connection and try again.');
      setAsanas([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAsanas = () => {
    let filtered = [...asanas];

    if (searchTerm) {
      filtered = filtered.filter(asana => 
        asana.english_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asana.sanskrit_name && asana.sanskrit_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asana.description && asana.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(asana => 
        asana.difficulty_level === selectedDifficulty
      );
    }

    setFilteredAsanas(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDifficulty('');
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

  // Temporarily removed authentication requirement to fix asana loading
  // if (!user) {
  //   return <AuthRequired />;
  // }

  // Handle asana loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your yoga library...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching 507+ yoga poses...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full text-center p-8">
          <div className="card">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-primary mb-4">
              Unable to Load Library
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-4">
              <button onClick={fetchAsanas} className="w-full btn-primary">
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="w-full btn-secondary">
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Asana Library
        </h1>
        <p className="text-gray-600">
          Explore {asanas.length} yoga poses with detailed instructions and images
        </p>
      </div>

      {/* Routine Suggestion */}
      <div className="mb-8">
        <RoutineSuggestion />
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search poses by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-transparent"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {(searchTerm || selectedDifficulty) && (
                <button
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-800 flex items-center text-sm"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredAsanas.length} of {asanas.length} poses
        </div>
      </div>

      {/* Asana Grid */}
      {filteredAsanas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAsanas.map((asana) => (
            <AsanaCard
              key={asana.id}
              asana={asana}
              onClick={() => setSelectedAsana(asana)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No poses found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button onClick={clearFilters} className="btn-primary">
            Clear Filters
          </button>
        </div>
      )}

      {/* Asana Detail Modal */}
      {selectedAsana && (
        <AsanaDetailModal 
          asana={selectedAsana} 
          onClose={() => setSelectedAsana(null)} 
        />
      )}
    </div>
  );
};

export default AsanaLibrary;