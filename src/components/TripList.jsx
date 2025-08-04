function TripList({ trips, onTripSelect }) {
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
        </div>
      ))}
    </div>
  );
}

export default TripList; 