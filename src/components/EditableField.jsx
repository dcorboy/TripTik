import { useState, useRef, useEffect } from 'preact/hooks';
import DateTimePicker from './DateTimePicker.jsx';

function EditableField({ 
  value, 
  onSave, 
  type = 'text', 
  className = '', 
  placeholder = 'Click to edit',
  formatValue = (val) => val,
  parseValue = (val) => val
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (type === 'datetime-local') {
      setShowDatePicker(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
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
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
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
      />
    );
  }

  return (
    <>
      <span 
        onClick={handleClick}
        className={`editable-field ${className}`}
        title="Click to edit"
      >
        {formatValue(value) || placeholder}
      </span>
      
      {showDatePicker && (
        <DateTimePicker
          value={value}
          onChange={(newValue) => {
            onSave(parseValue(newValue));
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </>
  );
}

export default EditableField; 