import { useState, useRef, useEffect } from 'preact/hooks';
import DateTimePicker from './DateTimePicker.jsx';
import { utcToLocal, localToUTC } from '../config/timezone.js';

function EditableField({ 
  value, 
  onSave, 
  type = 'text', 
  className = '', 
  placeholder = 'Click to edit',
  formatValue = (val) => val,
  parseValue = (val) => val,
  timezone,
  tabIndex
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [originalValue, setOriginalValue] = useState(value);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // useEffect(() => {
  //   if (isEditing && inputRef.current) {
  //     inputRef.current.focus();
  //     inputRef.current.select();
  //   }
  // }, [isEditing]);

  const handleClick = () => {
    if (type === 'datetime-local') {
      setShowDatePicker(true);
    } else {
      setOriginalValue(value);
      setEditValue(value);
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== originalValue) {
      onSave(parseValue(editValue));
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      // Get the current value directly from the input element
      const currentValue = inputRef.current ? inputRef.current.value : editValue;
      if (currentValue !== originalValue) {
        onSave(parseValue(currentValue));
      }
    } else if (e.key === 'Escape') {
      setEditValue(originalValue);
      setIsEditing(false);
    }
  };

  // Convert UTC value to local for DateTimePicker
  const getLocalValueForPicker = () => {
    if (type === 'datetime-local' && timezone && value) {
      const local = utcToLocal(timezone, value);
      return local;
    }
    return value;
  };

  // Convert local value from DateTimePicker to UTC
  const handleDateTimeChange = (localDate) => {
    if (timezone) {
      const utcValue = localToUTC(timezone, localDate);
      onSave(utcValue);
    } else {
      onSave(localDate);
    }
    setShowDatePicker(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`editable-input ${className}`}
        placeholder={placeholder}
        tabIndex={tabIndex}
      />
    );
  }

  return (
    <>
      <span 
        onClick={handleClick}
        className={`editable-field ${className}`}
        title="Click to edit"
        tabIndex={tabIndex}
        role="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {formatValue(value) || placeholder}
      </span>
      
      {showDatePicker && (
        <DateTimePicker
          value={getLocalValueForPicker()}
          onChange={handleDateTimeChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </>
  );
}

export default EditableField; 