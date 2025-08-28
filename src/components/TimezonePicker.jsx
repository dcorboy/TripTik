import { useState, useRef, useEffect } from 'preact/hooks';

const TIMEZONE_OPTIONS = [
  // US Timezones
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Time - Arizona (MST)' },
  { value: 'America/Boise', label: 'Mountain Time - Idaho (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)' },
  { value: 'Europe/Brussels', label: 'Brussels (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET/CEST)' },
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)' },
  { value: 'Europe/Prague', label: 'Prague (CET/CEST)' },
  { value: 'Europe/Budapest', label: 'Budapest (CET/CEST)' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  
  // Asia
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Taipei', label: 'Taipei (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (MYT)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)' },
  { value: 'Asia/Manila', label: 'Manila (PHT)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Qatar', label: 'Qatar (AST)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)' },
  { value: 'Asia/Amman', label: 'Amman (EET/EEST)' },
  { value: 'Asia/Beirut', label: 'Beirut (EET/EEST)' },
  
  // Australia/Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  
  // Africa
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET/EEST)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Accra', label: 'Accra (GMT)' },
  { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (EAT)' },
  
  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT/BRST)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)' },
  { value: 'America/Santiago', label: 'Santiago (CLT/CLST)' },
  { value: 'America/Lima', label: 'Lima (PET)' },
  { value: 'America/Bogota', label: 'Bogotá (COT)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' },
  { value: 'America/Cancun', label: 'Cancún (EST)' },
  { value: 'America/Guatemala', label: 'Guatemala City (CST)' },
  { value: 'America/Costa_Rica', label: 'Costa Rica (CST)' },
  { value: 'America/Panama', label: 'Panama City (EST)' },
  { value: 'America/Caracas', label: 'Caracas (VET)' },
  { value: 'America/Guayaquil', label: 'Guayaquil (ECT)' },
  { value: 'America/Asuncion', label: 'Asunción (PYT/PYST)' },
  { value: 'America/Montevideo', label: 'Montevideo (UYT/UYST)' }
];

function TimezonePicker({ value, onChange, onClose, tabIndex }) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTimezoneSelect = (timezoneValue) => {
    onChange(timezoneValue);
    setIsOpen(false);
    onClose?.();
  };

  const currentTimezone = TIMEZONE_OPTIONS.find(option => option.value === value) || TIMEZONE_OPTIONS[0];

  return (
    <div className="timezone-picker-container" ref={pickerRef}>
      <div 
        className="timezone-display"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to change timezone"
        tabIndex={tabIndex}
        role="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {currentTimezone.label}
        <span className="timezone-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="timezone-dropdown">
          {TIMEZONE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`timezone-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleTimezoneSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimezonePicker; 