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
    const result = analyzeTrip(trip, currentLegs, true);
    setAnalysisResult(result);
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = document.querySelector('.render-content').innerHTML;
    
    // Get the current CSS styles
    const styleSheets = Array.from(document.styleSheets);
    let cssText = '';
    
    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules);
        rules.forEach(rule => {
          cssText += rule.cssText + '\n';
        });
      } catch (e) {
        // Skip external stylesheets that might cause CORS issues
        console.log('Skipping external stylesheet:', e);
      }
    });
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${trip.name} - TripTik</title>
          <style>
            ${cssText}
            
            /* Print-specific overrides */
            body {
              margin: 20px;
              background: white;
            }
            
            .render-content {
              width: 100%;
              max-width: none;
              margin: 0;
              padding: 0;
            }
            
            @media print {
              body { 
                margin: 0; 
                font-size: 12px;
              }
              
              .render-content {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="render-content">
            ${printContent}
          </div>
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
        <p>Richtext render for copying or printing</p>
      </div>

      {/* Back to Trips button */}
      <div className="btn-left-container">
        <button
          className="btn-secondary"
          onClick={onBack}
          title="Back to trips list"
        >
          ← Back to Trip
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
        <h1>{trip.name}</h1>
        {trip.description && <p>{trip.description}</p>}
      </div>

      {/* Full page-width container for output */}
      <div className="render-container">
        <div className="render-content">
          <div dangerouslySetInnerHTML={{ __html: analysisResult || 'No TripTik available' }} />
        </div>
      </div>
    </div>
  );
}

export default TripRender; 