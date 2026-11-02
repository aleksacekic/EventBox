import React from 'react';

// Zaglavlje jednog dela admin stranice: ikona, naslov, broj stavki i kratak opis.
// children: dodatak ispod (npr. polje za pretragu).
function AdminNaslov({ ikona, naslov, opis, broj, children }) {
  return (
    <div className="admin-naslov">
      <div className="admin-naslov-red">
        <span className="admin-naslov-ikona"><i className={`la ${ikona}`} /></span>
        <div className="admin-naslov-tekst">
          <h2>
            {naslov}
            {broj != null && <span className="admin-broj">{broj}</span>}
          </h2>
          {opis && <p>{opis}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default AdminNaslov;
