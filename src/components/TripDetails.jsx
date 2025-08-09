import { useState, useEffect } from 'preact/hooks';
import EditableField from './EditableField.jsx';
import { analyzeTrip } from '../utils/tripAnalyzer.js';
import { formatInTimezone, formatTimeInTimezone, formatDateInTimezone, setUserTimezone, getUserTimezone } from '../config/timezone.js';
import { getTimezoneForLocation } from '../utils/locationTimezone.js';
import TimezonePicker from './TimezonePicker.jsx';
import { parseLegFromText } from '../utils/legTextInterpreter.js';

function TripDetails({ trip, onBack, apiBase, onTripUpdate, onLegsChange }) {
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [analysisResult, setAnalysisResult] = useState('');
  const [currentTimezone, setCurrentTimezone] = useState(getUserTimezone());
  const [currentTrip, setCurrentTrip] = useState(trip);
  const [pastedLegText, setPastedLegText] = useState('');

  useEffect(() => {
    fetchLegs();
  }, [trip.id]);

  // Update analysis when legs change
  useEffect(() => {
    if (!loading && !error) {
      updateAnalysis(legs);
    }
  }, [legs, loading, error]);

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
      updateAnalysis(sortedLegs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString, timezone) => formatDateInTimezone(dateString, timezone);
  const formatTime = (dateString, timezone) => formatTimeInTimezone(dateString, timezone);
  const formatDateTime = (dateString, timezone) => formatInTimezone(dateString, timezone);

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

  const parseDateFromPicker = (dateValue) => {
    if (!dateValue) return null;
    // DateTimePicker now returns a Date object, convert to ISO string
    return dateValue instanceof Date ? dateValue.toISOString() : dateValue;
  };

  const updateAnalysis = (currentLegs) => {
    const result = analyzeTrip(currentTrip, currentLegs);
    setAnalysisResult(result);
  };

  const handleTripUpdate = async (field, value) => {
    try {
      const response = await fetch(`${apiBase}/trips/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value })
      });

      if (!response.ok) {
        throw new Error('Failed to update trip');
      }

      const updatedTrip = await response.json();
      setCurrentTrip(updatedTrip);
      
      // Notify parent component about the trip update
      if (onTripUpdate) {
        onTripUpdate(updatedTrip);
      }
    } catch (err) {
      console.error('Error updating trip:', err);
    }
  };

  const handleTimezoneChange = (newTimezone) => {
    setUserTimezone(newTimezone);
    setCurrentTimezone(newTimezone);
    // Force re-analysis to update times
    updateAnalysis(legs);
  };

  const handleLegUpdate = async (legId, field, value) => {
    try {
      setUpdating(prev => ({ ...prev, [legId]: true }));
      
      // Special handling for timezone changes
      let updateData = { [field]: value };
      
      // Auto-set timezone when location changes
      if (field === 'departure_location') {
        const timezone = getTimezoneForLocation(value);
        if (timezone) {
          updateData.departure_timezone = timezone;
        }
      } else if (field === 'arrival_location') {
        const timezone = getTimezoneForLocation(value);
        if (timezone) {
          updateData.arrival_timezone = timezone;
        }
      } else if (field === 'departure_timezone' || field === 'arrival_timezone') {
        // For timezone changes, we don't need to modify the datetime
        // The display will automatically show the time in the new timezone
        // Just update the timezone field
      }
      
      const response = await fetch(`${apiBase}/legs/${legId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to update leg');
      }

      const updatedLeg = await response.json();
      
      // Update the legs list with the new data and re-sort
      setLegs(prevLegs => {
        const updatedLegs = prevLegs.map(leg => 
          leg.id === legId ? { ...leg, ...updatedLeg } : leg
        );
        const sortedLegs = updatedLegs.sort((a, b) => {
          const dateA = new Date(a.departure_datetime);
          const dateB = new Date(b.departure_datetime);
          return dateA - dateB;
        });
        updateAnalysis(sortedLegs);
        
        // Notify parent about legs change
        if (onLegsChange) {
          onLegsChange();
        }
        
        return sortedLegs;
      });
    } catch (err) {
      console.error('Error updating leg:', err);
      // You could show a toast notification here
    } finally {
      setUpdating(prev => ({ ...prev, [legId]: false }));
    }
  };

  const handleLegDelete = async (legId) => {
    if (!confirm('Are you sure you want to delete this leg?')) {
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [legId]: true }));
      
      const response = await fetch(`${apiBase}/legs/${legId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete leg');
      }

      // Remove the leg from the list
      setLegs(prevLegs => {
        const filteredLegs = prevLegs.filter(leg => leg.id !== legId);
        updateAnalysis(filteredLegs);
        
        // Notify parent about legs change
        if (onLegsChange) {
          onLegsChange();
        }
        
        return filteredLegs;
      });
    } catch (err) {
      console.error('Error deleting leg:', err);
      // You could show a toast notification here
    } finally {
      setUpdating(prev => ({ ...prev, [legId]: false }));
    }
  };

  const createLegFromText = async (text) => {
    if (!text || text.trim().length === 0) return;
    try {
      const inferredLeg = parseLegFromText(text, currentTimezone, trip.id);
      const response = await fetch(`${apiBase}/legs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inferredLeg),
      });
      if (!response.ok) {
        throw new Error('Failed to create leg from pasted text');
      }
      const createdLeg = await response.json();
      setLegs((prevLegs) => {
        const updatedLegs = [...prevLegs, createdLeg];
        const sortedLegs = updatedLegs.sort((a, b) => new Date(a.departure_datetime) - new Date(b.departure_datetime));
        updateAnalysis(sortedLegs);
        if (onLegsChange) onLegsChange();
        return sortedLegs;
      });
      setPastedLegText('');
    } catch (err) {
      console.error('Error creating leg from pasted text:', err);
    }
  };

  const handlePastedLegTextPaste = async (event) => {
    const clipboard = event.clipboardData || window.clipboardData;
    if (!clipboard) return;
    const text = clipboard.getData ? clipboard.getData('text/plain') : '';
    if (text && text.length > 0) {
      event.preventDefault();
      await createLegFromText(text);
    }
  };

  const handleAddLeg = async () => {
    try {
      const newLeg = {
        name: 'New Leg',
        departure_datetime: new Date().toISOString(),
        departure_location: '',
        departure_timezone: currentTimezone,
        arrival_datetime: new Date().toISOString(),
        arrival_location: '',
        arrival_timezone: currentTimezone,
        carrier: '',
        trip_id: trip.id
      };

      const response = await fetch(`${apiBase}/legs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLeg)
      });

      if (!response.ok) {
        throw new Error('Failed to create leg');
      }

      const createdLeg = await response.json();
      
      // Add the new leg and re-sort
      setLegs(prevLegs => {
        const updatedLegs = [...prevLegs, createdLeg];
        const sortedLegs = updatedLegs.sort((a, b) => {
          const dateA = new Date(a.departure_datetime);
          const dateB = new Date(b.departure_datetime);
          return dateA - dateB;
        });
        updateAnalysis(sortedLegs);
        
        // Notify parent about legs change
        if (onLegsChange) {
          onLegsChange();
        }
        
        return sortedLegs;
      });
    } catch (err) {
      console.error('Error creating leg:', err);
      // You could show a toast notification here
    }
  };

  return (
    <div>
      <button className="back-button" onClick={onBack}>
        ← Back to Trips
      </button>
      
      <div className="header">
        <h1>
          <EditableField
            value={currentTrip.name}
            onSave={(value) => handleTripUpdate('name', value)}
            className="trip-title"
            placeholder="Trip name"
          />
        </h1>
        <p>
          <EditableField
            value={currentTrip.description || ''}
            onSave={(value) => handleTripUpdate('description', value)}
            className="trip-description"
            placeholder="Add trip description"
          />
        </p>
        <div className="timezone-info">
          Times displayed in: <TimezonePicker 
            value={currentTimezone}
            onChange={handleTimezoneChange}
          />
        </div>
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
        <div className="detail-container">
          <div className="legs-container">
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No legs found for this trip. Add some legs to get started!
            </div>
            <div className="add-leg-container">
              <button
                className="add-leg-btn"
                onClick={handleAddLeg}
                title="Add new leg"
              >
                + Add Leg
              </button>
              <input
                type="text"
                className="pasted-leg-input"
                placeholder="Paste Leg Info"
                value={pastedLegText}
                onInput={(e) => setPastedLegText(e.target.value)}
                onPaste={handlePastedLegTextPaste}
                style={{ marginLeft: '10px', flex: '1 1 auto' }}
              />
            </div>
          </div>
          <div className="result">
            <div className="result-content">
              <pre>{analysisResult || 'No TripTik available'}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="detail-container">
          <div className="legs-container">
            {legs.map((leg) => (
              <div key={leg.id} className={`leg-item ${updating[leg.id] ? 'updating' : ''}`}>
                <div className="leg-header">
                  <div className="leg-header-left">
                    <EditableField
                      value={leg.name}
                      onSave={(value) => handleLegUpdate(leg.id, 'name', value)}
                      className="leg-name"
                      placeholder="Leg name"
                    />
                    <EditableField
                      value={leg.carrier || ''}
                      onSave={(value) => handleLegUpdate(leg.id, 'carrier', value)}
                      className="leg-carrier"
                      placeholder="flight/ship"
                    />
                    <EditableField
                      value={leg.confirmation || ''}
                      onSave={(value) => handleLegUpdate(leg.id, 'confirmation', value)}
                      className="leg-conf"
                      placeholder="conf#"
                    />
                  </div>
                  <button
                    className="delete-leg-btn fa-solid fa-trash"
                    onClick={() => handleLegDelete(leg.id)}
                    title="Delete leg"
                  >
                  </button>
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
                    <div className="datetime-container">
                      <EditableField
                        value={leg.departure_datetime}
                        onSave={(value) => handleLegUpdate(leg.id, 'departure_datetime', value)}
                        type="datetime-local"
                        formatValue={(value) => formatDateTime(value, leg.departure_timezone || 'America/New_York')}
                        parseValue={parseDateFromPicker}
                        className="time-value"
                        placeholder="Departure date/time"
                        timezone={leg.departure_timezone || 'America/New_York'}
                      />
                      <TimezonePicker
                        value={leg.departure_timezone || 'America/New_York'}
                        onChange={(timezone) => handleLegUpdate(leg.id, 'departure_timezone', timezone)}
                      />
                    </div>
                  </div>
                  
                  <div className="leg-location">
                    <div className="location-label">Arrival</div>
                    <EditableField
                      value={leg.arrival_location}
                      onSave={(value) => handleLegUpdate(leg.id, 'arrival_location', value)}
                      className="location-value"
                      placeholder="Arrival location"
                    />
                    <div className="datetime-container">
                      <EditableField
                        value={leg.arrival_datetime}
                        onSave={(value) => handleLegUpdate(leg.id, 'arrival_datetime', value)}
                        type="datetime-local"
                        formatValue={(value) => formatDateTime(value, leg.arrival_timezone || 'America/New_York')}
                        parseValue={parseDateFromPicker}
                        className="time-value"
                        placeholder="Arrival date/time"
                        timezone={leg.arrival_timezone || 'America/New_York'}
                      />
                      <TimezonePicker
                        value={leg.arrival_timezone || 'America/New_York'}
                        onChange={(timezone) => handleLegUpdate(leg.id, 'arrival_timezone', timezone)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="add-leg-container">
              <button
                className="add-leg-btn"
                onClick={handleAddLeg}
                title="Add new leg"
              >
                + Add Leg
              </button>
              <input
                type="text"
                className="pasted-leg-input"
                placeholder="Paste Leg Info"
                value={pastedLegText}
                onInput={(e) => setPastedLegText(e.target.value)}
                onPaste={handlePastedLegTextPaste}
                style={{ marginLeft: '10px', flex: '1 1 auto' }}
              />
            </div>
          </div>
          
          <div className="result">
            <div className="result-content">
              <pre>{analysisResult || 'No TripTik available'}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripDetails; 