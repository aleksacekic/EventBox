import React from 'react';
import { API_BASE } from '../api';

// Profilna slika korisnika, a bez nje krug sa pocetnim slovom imena (kao u cetu).
// Ranije je umesto toga isla slika sa via.placeholder.com, servisa koji vise ne radi.
// className daje velicinu i oblik (isti kao za <img>), avatar-inicijal samo izgled slova.
function Avatar({ slika, ime, className = '', alt = '' }) {
  if (slika) {
    return <img className={className} src={`${API_BASE}/resources/${slika}`} alt={alt} />;
  }
  const slovo = (ime || '?').trim().replace(/^@/, '').charAt(0).toUpperCase() || '?';
  return (
    <span className={`${className} avatar-inicijal`} role="img" aria-label={alt || ime || 'Korisnik'}>
      {slovo}
    </span>
  );
}

export default Avatar;
