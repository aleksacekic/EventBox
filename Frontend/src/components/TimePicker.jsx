import React from 'react';
import { useTranslation } from 'react-i18next';

const SATI = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTI = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Dva dropdown-a (sati / minuti) umesto slobodnog teksta ili native
// <input type="time"> - potonji prikazuje AM/PM po sistemskoj lokaciji
// browsera (nepouzdano, ne moze se iskljuciti preko HTML-a). Ovako je unos
// uvek validan 24-casovni format, bez ikakvog kucanja.
const TimePicker = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [sat = '', minut = ''] = (value || '').split(':');

  const emitChange = (noviSat, noviMinut) => {
    if (noviSat && noviMinut) {
      onChange(`${noviSat}:${noviMinut}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="create-event-time">
      <select
        id="time"
        className="create-event-input create-event-time-select"
        value={sat}
        onChange={(e) => emitChange(e.target.value, minut || '00')}
      >
        <option value="" disabled>{t('eventForm.hours')}</option>
        {SATI.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <span className="create-event-time-sep">:</span>
      <select
        className="create-event-input create-event-time-select"
        value={minut}
        onChange={(e) => emitChange(sat || '00', e.target.value)}
      >
        <option value="" disabled>{t('eventForm.minutes')}</option>
        {MINUTI.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
};

export default TimePicker;
