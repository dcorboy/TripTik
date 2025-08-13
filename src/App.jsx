import { useState, useEffect } from 'preact/hooks';
import TripList from './components/TripList.jsx';
import TripDetails from './components/TripDetails.jsx';
import TripRender from './components/TripRender.jsx';

const API_BASE = '/api';

function App() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [printTrip, setPrintTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  // Check for print parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const printTripId = urlParams.get('print');
    
    if (printTripId && trips.length > 0) {
      const trip = trips.find(t => t.id == printTripId);
      if (trip) {
        setPrintTrip(trip);
      }
    }
  }, [trips]);

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
    setPrintTrip(null);
  };

  const handleTripUpdate = (updatedTrip) => {
    // Update the trip in the trips list
    setTrips(prevTrips => 
      prevTrips.map(trip => 
        trip.id === updatedTrip.id ? updatedTrip : trip
      )
    );
    
    // Update the selected trip if it's the same one
    setSelectedTrip(updatedTrip);
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
      
      // Update the selected trip if it exists
      if (selectedTrip) {
        const updatedSelectedTrip = tripsData.find(trip => trip.id === selectedTrip.id);
        if (updatedSelectedTrip) {
          setSelectedTrip(updatedSelectedTrip);
        }
      }
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
      
      // If the deleted trip was selected, clear the selection
      if (selectedTrip && selectedTrip.id === tripId) {
        setSelectedTrip(null);
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

  return (
    <div className="container">
      {printTrip ? (
        <TripRender 
          trip={printTrip} 
          onBack={handleBackToList}
          apiBase={API_BASE}
        />
      ) : selectedTrip ? (
        <>
          <div className="header">
            <h1>TripTik</h1>
            <p>Select a trip to view its details</p>
          </div>
          <TripDetails 
            trip={selectedTrip} 
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