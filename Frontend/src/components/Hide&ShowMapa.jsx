import React, { useState } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';

// Mapa za PRIKAZ vec postavljene lokacije, sakrivena iza dugmeta - koristi se
// u karticama dogadjaja i na profilu. Standardizovano na
// @vis.gl/react-google-maps (ista biblioteka kao Mapa.jsx - pre je ovde bio
// @react-google-maps/api, dva razlicita nacina rada sa istim Google Maps-om).
const HideShowMapa = ({ latitude, longitude }) => {
  const [mapVisible, setMapVisible] = useState(false);

  const toggleMap = () => {
    setMapVisible(!mapVisible);
  };

  return (
    <div>
      <button id="toggleMapa" className={`prikazimapubutton ${mapVisible ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); toggleMap(); }}>
        {mapVisible ? 'Zatvori mapu dogadjaja' : 'Prikazi mapu dogadjaja'}
      </button>
      {mapVisible && (
        <div style={{ height: '250px', width: '100%' }}>
          <Map
            defaultZoom={11}
            defaultCenter={{ lat: latitude, lng: longitude }}
            mapId="DEMO_MAP_ID" // AdvancedMarker ne radi bez mapId - zameni pravim iz Cloud Console-a u produkciji
          >
            <AdvancedMarker position={{ lat: latitude, lng: longitude }} />
          </Map>
        </div>
      )}
    </div>
  );
};

export default HideShowMapa;
