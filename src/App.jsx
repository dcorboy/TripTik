import { useState, useEffect } from 'preact/hooks';
import TripList from './components/TripList.jsx';
import TripDetails from './components/TripDetails.jsx';
import TripRender from './components/TripRender.jsx';

// Simple router hook
function useRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Replace the current history entry to clear any previous state
    window.history.replaceState({ path: currentPath }, '', currentPath);
    
    const handlePopState = (event) => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPath]);

  const navigate = (path) => {
    if (path !== currentPath) {
      if (hasNavigated) {
        // Only push to history if we've already navigated at least once
        window.history.pushState({ path }, '', path);
      }
      setCurrentPath(path);
      setHasNavigated(true);
    }
  };

  return { currentPath, navigate };
}

const API_BASE = '/api';

function App() {
  const { currentPath, navigate } = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  // Parse current route
  const parseRoute = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return { type: 'list' };
    }
    
    if (pathParts[0] === 'trip' && pathParts[1]) {
      const tripId = parseInt(pathParts[1]);
      const trip = trips.find(t => t.id === tripId);
      
      if (!trip) {
        return { type: 'list' };
      }
      
      if (pathParts[2] === 'render') {
        return { type: 'render', trip };
      } else {
        return { type: 'details', trip };
      }
    }
    
    return { type: 'list' };
  };

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
    navigate(`/trip/${trip.id}`);
  };

  const handleBackToList = () => {
    navigate('/');
  };

  const handleBackToTripDetails = (trip) => {
    navigate(`/trip/${trip.id}`);
  };

  const handleTripUpdate = (updatedTrip) => {
    // Update the trip in the trips list
    setTrips(prevTrips => 
      prevTrips.map(trip => 
        trip.id === updatedTrip.id ? updatedTrip : trip
      )
    );
  };

  const handleLegsChange = async () => {
    // Refresh the trip data to update start_date and end_date
    try {
      const response = await fetch(`${API_BASE}/users/1/trips`);
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const tripsData = await response.json();
      setTrips(tripsData);
    } catch (err) {
      console.error('Error refreshing trips:', err);
    }
  };

  const handleAddTrip = async () => {
    try {
      const newTrip = {
        name: 'New Trip',
        description: '',
        user_id: 1 // Hardcoded user ID for now
      };

      const response = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTrip)
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      const createdTrip = await response.json();
      setTrips(prevTrips => [...prevTrips, createdTrip]);
    } catch (err) {
      console.error('Error creating trip:', err);
      // You could show a toast notification here
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      const response = await fetch(`${API_BASE}/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      // Remove the trip from the list
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
      
      // If the deleted trip was selected, go back to list
      const currentRoute = parseRoute();
      if (currentRoute.type !== 'list' && currentRoute.trip && currentRoute.trip.id === tripId) {
        navigate('/');
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      // You could show a toast notification here
    }
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

  const currentRoute = parseRoute();

  return (
    <div className="container">
      {currentRoute.type === 'render' ? (
        <TripRender 
          trip={currentRoute.trip} 
          onBack={() => handleBackToTripDetails(currentRoute.trip)}
          apiBase={API_BASE}
        />
      ) : currentRoute.type === 'details' ? (
        <>
          <div className="header">
            <h1>TripTik</h1>
            <p>Select a trip to view its details</p>
          </div>
          <TripDetails 
            trip={currentRoute.trip} 
            onBack={handleBackToList}
            apiBase={API_BASE}
            onTripUpdate={handleTripUpdate}
            onLegsChange={handleLegsChange}
          />
        </>
      ) : (
        <>
          <div className="header">
            <h1>TripTik</h1>
            <p>Select a trip to view its details</p>
          </div>
          <TripList 
            trips={trips} 
            onTripSelect={handleTripSelect}
            onAddTrip={handleAddTrip}
            onDeleteTrip={handleDeleteTrip}
          />
        </>
      )}
    </div>
  );
}

export default App; 