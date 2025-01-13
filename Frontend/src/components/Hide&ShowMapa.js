
import React, { useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const HideShowMapa = ({ latitude, longitude }) => {
  const [mapVisible, setMapVisible] = useState(false);

  const toggleMap = () => {
    setMapVisible(!mapVisible);
  };

  return (
    <div>
      <button id="toggleMapa" className={`prikazimapubutton ${mapVisible ? 'active' : ''}`} onClick={toggleMap}>
        {mapVisible ? 'Zatvori mapu dogadjaja' : 'Prikazi mapu dogadjaja'}
      </button>
      {mapVisible && (
        <div style={{ height: '250px', width: '100%' }}>
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            zoom={11}
            center={{ lat: latitude, lng: longitude }}
          >
            <Marker position={{ lat: latitude, lng: longitude }} />
          </GoogleMap>
        </div>
      )}
    </div>
  );
};

export default HideShowMapa;
