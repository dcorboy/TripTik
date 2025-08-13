import { useState, useEffect } from 'preact/hooks';
import { analyzeTrip } from '../utils/tripAnalyzer.js';

function TripRender({ trip, onBack, apiBase }) {
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState('');

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

  const updateAnalysis = (currentLegs) => {
    const result = analyzeTrip(trip, currentLegs);
    setAnalysisResult(result);
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = document.querySelector('.render-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${trip.name} - TripTik</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.6;
              margin: 20px;
              background: white;
            }
            pre {
              margin: 0;
              padding: 0;
              background: none;
              border: none;
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading trip data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          Error: {error}
          <button onClick={fetchLegs} style={{ marginLeft: '10px', padding: '5px 10px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* First header */}
      <div className="header">
        <h1>TripTik</h1>
        <p>Print View</p>
      </div>

      {/* Back to Trips button */}
      <div className="btn-primary-container">
        <button
          className="btn-primary"
          onClick={onBack}
          title="Back to trips list"
        >
          ← Back to Trips
        </button>
        <button
          className="btn-primary"
          onClick={handlePrint}
          title="Print this page"
        >
          🖨️ Print
        </button>
      </div>

      {/* Second header */}
      <div className="header">
        <h2>{trip.name}</h2>
        {trip.description && <p>{trip.description}</p>}
      </div>

      {/* Full page-width container for output */}
      <div className="render-container">
        <div className="render-content">
          <pre>{analysisResult || 'No TripTik available'}</pre>
        </div>
      </div>
    </div>
  );
}

export default TripRender; 