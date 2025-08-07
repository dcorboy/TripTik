import { formatDateInUserTimezone } from '../config/timezone.js';

function TripList({ trips, onTripSelect, onAddTrip, onDeleteTrip }) {
  const formatDate = formatDateInUserTimezone;

  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (!start && !end) return null;
    if (!start) return end;
    if (!end) return start;
    if (start === end) return start;
    return `${start} - ${end}`;
  };

  const handleDeleteTrip = (e, tripId) => {
    e.stopPropagation(); // Prevent triggering the trip selection
    if (confirm('Are you sure you want to delete this trip?')) {
      onDeleteTrip(tripId);
    }
  };

  if (trips.length === 0) {
    return (
      <div className="trip-list">
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No trips found. Create your first trip to get started!
        </div>
        <div className="add-trip-container">
          <button
            className="add-trip-btn"
            onClick={onAddTrip}
            title="Add new trip"
          >
            + Add Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-list">
      {trips.map((trip) => (
        <div 
          key={trip.id} 
          className="trip-item"
          onClick={() => onTripSelect(trip)}
        >
          <div className="trip-header">
            <div className="trip-header-left">
              <div className="trip-name">{trip.name}</div>
              {trip.description && (
                <div className="trip-description">{trip.description}</div>
              )}
            </div>
            <button
              className="delete-trip-btn fa-solid fa-trash"
              onClick={(e) => handleDeleteTrip(e, trip.id)}
              title="Delete trip"
            >
            </button>
          </div>
          {(trip.start_date || trip.end_date) && (
            <div className="trip-dates">
              {formatDateRange(trip.start_date, trip.end_date)}
            </div>
          )}
        </div>
      ))}
      
      <div className="add-trip-container">
        <button
          className="add-trip-btn"
          onClick={onAddTrip}
          title="Add new trip"
        >
          + Add Trip
        </button>
      </div>
    </div>
  );
}

export default TripList; 