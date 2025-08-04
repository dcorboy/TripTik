import { useState, useEffect } from 'preact/hooks';

function TripDetails({ trip, onBack, apiBase }) {
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <div key={leg.id} className="leg-item">
              <div className="leg-header">
                <div className="leg-name">{leg.name}</div>
                {leg.carrier && (
                  <div className="leg-carrier">{leg.carrier}</div>
                )}
              </div>
              
              <div className="leg-details">
                <div className="leg-location">
                  <div className="location-label">Departure</div>
                  <div>{leg.departure_location || 'Not specified'}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {formatDateTime(leg.departure_datetime)}
                  </div>
                </div>
                
                <div className="leg-location">
                  <div className="location-label">Arrival</div>
                  <div>{leg.arrival_location || 'Not specified'}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {formatDateTime(leg.arrival_datetime)}
                  </div>
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