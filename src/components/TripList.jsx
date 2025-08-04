function TripList({ trips, onTripSelect }) {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    
    if (!start && !end) return null;
    if (!start) return end;
    if (!end) return start;
    if (start === end) return start;
    return `${start} - ${end}`;
  };

  if (trips.length === 0) {
    return (
      <div className="trip-list">
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No trips found. Create your first trip to get started!
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
          <div className="trip-name">{trip.name}</div>
          {trip.description && (
            <div className="trip-description">{trip.description}</div>
          )}
          {(trip.start_date || trip.end_date) && (
            <div className="trip-dates">
              {formatDateRange(trip.start_date, trip.end_date)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TripList; 