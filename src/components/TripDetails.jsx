import { useState, useEffect } from 'preact/hooks';
import EditableField from './EditableField.jsx';

function TripDetails({ trip, onBack, apiBase }) {
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchLegs();
  }, [trip.id]);

  const fetchLegs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiBase}/trips/${trip.id}/legs`);
      if (!response.ok) {
        throw new Error('Failed to fetch legs');
      }
      const legsData = await response.json();
      
      // Sort legs by departure_datetime in chronological order
      const sortedLegs = legsData.sort((a, b) => {
        const dateA = new Date(a.departure_datetime);
        const dateB = new Date(b.departure_datetime);
        return dateA - dateB;
      });
      
      setLegs(sortedLegs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Convert to local timezone for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const parseDateFromInput = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString();
  };

  const handleLegUpdate = async (legId, field, value) => {
    try {
      setUpdating(prev => ({ ...prev, [legId]: true }));
      
      const response = await fetch(`${apiBase}/legs/${legId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) {
        throw new Error('Failed to update leg');
      }

      const updatedLeg = await response.json();
      
      // Update the legs list with the new data
      setLegs(prevLegs => 
        prevLegs.map(leg => 
          leg.id === legId ? { ...leg, ...updatedLeg } : leg
        )
      );
    } catch (err) {
      console.error('Error updating leg:', err);
      // You could show a toast notification here
    } finally {
      setUpdating(prev => ({ ...prev, [legId]: false }));
    }
  };

  return (
    <div>
      <button className="back-button" onClick={onBack}>
        ← Back to Trips
      </button>
      
      <div className="header">
        <h1>{trip.name}</h1>
        {trip.description && <p>{trip.description}</p>}
      </div>

      {loading ? (
        <div className="loading">Loading legs...</div>
      ) : error ? (
        <div className="error">
          Error: {error}
          <button onClick={fetchLegs} style={{ marginLeft: '10px', padding: '5px 10px' }}>
            Retry
          </button>
        </div>
      ) : legs.length === 0 ? (
        <div className="legs-container">
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No legs found for this trip. Add some legs to get started!
          </div>
        </div>
      ) : (
        <div className="legs-container">
          {legs.map((leg) => (
            <div key={leg.id} className={`leg-item ${updating[leg.id] ? 'updating' : ''}`}>
              <div className="leg-header">
                <EditableField
                  value={leg.name}
                  onSave={(value) => handleLegUpdate(leg.id, 'name', value)}
                  className="leg-name"
                  placeholder="Leg name"
                />
                {leg.carrier && (
                  <EditableField
                    value={leg.carrier}
                    onSave={(value) => handleLegUpdate(leg.id, 'carrier', value)}
                    className="leg-carrier"
                    placeholder="Carrier"
                  />
                )}
              </div>
              
              <div className="leg-details">
                <div className="leg-location">
                  <div className="location-label">Departure</div>
                  <EditableField
                    value={leg.departure_location}
                    onSave={(value) => handleLegUpdate(leg.id, 'departure_location', value)}
                    className="location-value"
                    placeholder="Departure location"
                  />
                  <EditableField
                    value={leg.departure_datetime}
                    onSave={(value) => handleLegUpdate(leg.id, 'departure_datetime', value)}
                    type="datetime-local"
                    formatValue={formatDateTime}
                    parseValue={parseDateFromInput}
                    className="datetime-value"
                    placeholder="Departure date/time"
                  />
                </div>
                
                <div className="leg-location">
                  <div className="location-label">Arrival</div>
                  <EditableField
                    value={leg.arrival_location}
                    onSave={(value) => handleLegUpdate(leg.id, 'arrival_location', value)}
                    className="location-value"
                    placeholder="Arrival location"
                  />
                  <EditableField
                    value={leg.arrival_datetime}
                    onSave={(value) => handleLegUpdate(leg.id, 'arrival_datetime', value)}
                    type="datetime-local"
                    formatValue={formatDateTime}
                    parseValue={parseDateFromInput}
                    className="datetime-value"
                    placeholder="Arrival date/time"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TripDetails; 