import { useEffect, useState } from 'react';
import Head from 'next/head';
import { apiGet } from '../utils/api';

interface TrainPosition {
  trainId: number;
  trainName: string;
  trainNumber: string;
  currentLat: number;
  currentLon: number;
  speed: number;
  heading: number;
  lastStation: string;
  nextStation: string;
  distanceToNext: number;
  totalDistance: number;
  distanceCovered: number;
  delay: number;
  status: string;
  estimatedArrival: string;
  progress: number;
  route: Array<{
    station: string;
    lat: number;
    lon: number;
    time: string;
    distance: number;
  }>;
}

export default function TrainTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrain, setSelectedTrain] = useState<TrainPosition | null>(null);
  const [allTrains, setAllTrains] = useState<TrainPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch all trains on component mount
  useEffect(() => {
    fetchAllTrains();
    
    // Set up auto-refresh every 5 seconds to ensure real-time updates
    const interval = setInterval(fetchAllTrains, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllTrains = async () => {
    try {
      const response = await apiGet('/api/live-location/trains');
      if (response.ok) {
        const data = await response.json();
        setAllTrains(data.trains || []);
        setLastUpdated(new Date());
        
        // Update selected train if it exists
        if (selectedTrain) {
          const updated = data.trains.find((t: TrainPosition) => t.trainId === selectedTrain.trainId);
          if (updated) {
            setSelectedTrain(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching trains:', err);
    }
  };

  const searchTrains = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiGet(`/api/live-location/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.results.length > 0) {
          setSelectedTrain(data.results[0]);
        } else {
          setError('No trains found matching your search');
        }
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (err) {
      setError('Search error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const selectTrain = (train: TrainPosition) => {
    setSelectedTrain(train);
    setError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'proceed':
      case 'on time': return 'text-green-600 bg-green-50';
      case 'warning':
      case 'delayed': return 'text-amber-600 bg-amber-50';
      case 'hold':
      case 'stopped': return 'text-red-600 bg-red-50';
      case 'early': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>IR - भारतीय रेल - Railway DSS</title>
      </Head>

      {/* Header */}
      <header className="bg-white text-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <div className="mr-4">
              <h1 className="text-2xl font-bold">IR</h1>
              <p className="text-sm">भारतीय रेल</p>
            </div>
            <p className="text-md">Live Train Map — Vertical (Fixed)</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Train Timeline Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Train Timeline (placeholder)</h2>
          <div className="bg-gray-50 p-4 rounded-md min-h-[100px] flex items-center justify-center text-gray-500">
            Interactive timeline/chart goes here
          </div>
        </div>

        {/* Live Train Map Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Train Map (Vertical)</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="mb-4">
              <div className="font-bold text-gray-700">Legend</div>
              <div className="text-green-600">Proceed</div>
              <div className="text-amber-600">Warning</div>
              <div className="text-red-600">Hold</div>
            </div>
            
            {/* Vertical Map Visualization would go here */}
            <div className="min-h-[150px]"></div>
          </div>
        </div>

        {/* Live Trains Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Live Trains</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Updated: {formatTime(lastUpdated)}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTrains.map((train) => (
              <div
                key={train.trainId}
                onClick={() => selectTrain(train)}
                className={`p-4 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 ${
                  selectedTrain?.trainId === train.trainId ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <div className="font-medium">{train.trainName}</div>
                <div className="text-sm text-gray-600">{train.trainNumber}</div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(train.status)}`}>
                    {train.status}
                  </span>
                  <span className="text-sm text-gray-500">{train.speed} km/h</span>
                </div>
              </div>
            ))}
          </div>
          
          {allTrains.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No trains available. Please check back later.
            </div>
          )}
          
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Loading trains...
            </div>
          )}
        </div>

        {/* Train Details Section - Only shown when a train is selected */}
        {selectedTrain ? (
          <div className="mt-8 space-y-6">
            {/* Train Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTrain.trainName}</h2>
                  <p className="text-lg text-gray-600">{selectedTrain.trainNumber}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedTrain.status)}`}>
                  {selectedTrain.status}
                  {selectedTrain.delay !== 0 && (
                    <span className="ml-1">
                      ({selectedTrain.delay > 0 ? '+' : ''}{selectedTrain.delay}min)
                    </span>
                  )}
                </span>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedTrain.speed}</div>
                  <div className="text-sm text-gray-600">km/h</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedTrain.progress}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedTrain.distanceCovered}</div>
                  <div className="text-sm text-gray-600">km done</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedTrain.distanceToNext}</div>
                  <div className="text-sm text-gray-600">km to next</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{selectedTrain.lastStation}</span>
                  <span>{selectedTrain.nextStation}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${selectedTrain.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Location */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📍 Current Location</h3>
                <p className="text-blue-700">
                  Between <strong>{selectedTrain.lastStation}</strong> and <strong>{selectedTrain.nextStation}</strong>
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Coordinates: {selectedTrain.currentLat.toFixed(4)}°N, {selectedTrain.currentLon.toFixed(4)}°E
                </p>
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">🗺️ Route Information</h3>
              <div className="space-y-3">
                {selectedTrain.route.map((station, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      station.station === selectedTrain.lastStation
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : station.station === selectedTrain.nextStation
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : selectedTrain.distanceCovered > station.distance
                        ? 'bg-gray-50'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{station.station}</div>
                      <div className="text-sm text-gray-600">{station.distance} km</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{station.time}</div>
                      {station.station === selectedTrain.lastStation && (
                        <div className="text-xs text-green-600">● Last Station</div>
                      )}
                      {station.station === selectedTrain.nextStation && (
                        <div className="text-xs text-blue-600">→ Next Station</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Map Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">🗺️ Live Map</h3>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🚂</div>
                  <p className="text-gray-600">Interactive map would be displayed here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Train currently at: {selectedTrain.currentLat.toFixed(4)}°N, {selectedTrain.currentLon.toFixed(4)}°E
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Find Your Train</h3>
            <p className="text-gray-600 mb-4">
              Search for a train by number or name, or select from the live trains list
            </p>
            <div className="text-sm text-gray-500">
              Try searching for: 12951, Mumbai Rajdhani, 90001, or Shatabdi
            </div>
          </div>
        )}
      </div>
    </div>
  );
}