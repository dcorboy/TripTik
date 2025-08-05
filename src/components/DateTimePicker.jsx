import { useState, useEffect, useRef } from 'preact/hooks';

function DateTimePicker({ value, onChange, onClose }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
      setSelectedDay(date.getDate());
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      const now = new Date();
      setSelectedDate(now.toISOString().split('T')[0]);
      setSelectedTime(now.toTimeString().slice(0, 5));
      setSelectedDay(now.getDate());
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateSelect = (day) => {
    if (day) {
      setSelectedDay(day);
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(newDate.toISOString().split('T')[0]);
    }
  };

  const handleSave = () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange(dateTime.toISOString());
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="datetime-picker-overlay">
      <div className="datetime-picker" ref={pickerRef}>
        <div className="picker-header">
          <button onClick={prevMonth} className="month-nav">&lt;</button>
          <span className="current-month">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button onClick={nextMonth} className="month-nav">&gt;</button>
        </div>
        
        <div className="calendar">
          <div className="calendar-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${!day ? 'empty' : ''} ${day === selectedDay ? 'selected' : ''}`}
                onClick={() => handleDateSelect(day)}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        
        <div className="time-section">
          <label>Time:</label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="time-input"
          />
        </div>
        
        <div className="picker-actions">
          <button onClick={handleCancel} className="cancel-btn">Cancel</button>
          <button onClick={handleSave} className="save-btn">Save</button>
        </div>
      </div>
    </div>
  );
}

export default DateTimePicker; 