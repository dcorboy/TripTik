import { useState, useEffect } from 'preact/hooks';
import TripList from './components/TripList.jsx';
import TripDetails from './components/TripDetails.jsx';

const API_BASE = '/api';

function App() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      // Using hardcoded user ID 1 for now
      const response = await fetch(`${API_BASE}/users/1/trips`);
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const tripsData = await response.json();
      setTrips(tripsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
  };

  const handleBackToList = () => {
    setSelectedTrip(null);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading trips...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          Error: {error}
          <button onClick={fetchTrips} style={{ marginLeft: '10px', padding: '5px 10px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>TripTik</h1>
        <p>Select a trip to view its details</p>
      </div>
      
      {selectedTrip ? (
        <TripDetails 
          trip={selectedTrip} 
          onBack={handleBackToList}
          apiBase={API_BASE}
        />
      ) : (
        <TripList 
          trips={trips} 
          onTripSelect={handleTripSelect}
        />
      )}
    </div>
  );
}

export default App; 