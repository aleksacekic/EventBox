import React, { useState } from 'react';

const TimePicker = ({ value, onChange }) => {
  const [isValid, setIsValid] = useState(true);

  const handleTimeChange = (event) => {
    const inputValue = event.target.value;
    onChange(inputValue);

    const isValidTime = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(inputValue);
    setIsValid(isValidTime);
  };

  return (
    <div className="form-group">
      <input
        placeholder="Unesi vreme. [sati:minuti]"
        type="text"
        id="time"
        className={`form-control ${isValid ? '' : 'is-invalid'}`}
        value={value}
        onChange={handleTimeChange}
      />
      {!isValid && value.length > 0 && <div className="invalid-feedback">Unesite validno vreme. Primer: 21:00</div>}
    </div>
  );
};

export default TimePicker;