import { useState, useRef, useEffect } from 'preact/hooks';

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' }
];

function TimezonePicker({ value, onChange, onClose }) {
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