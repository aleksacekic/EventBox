import React, { useCallback, useState } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const pocetniCentar = { lat: 44.2107675, lng: 20.9224158 }; // Beograd - da se vidi Srbija

// Mapa za POSTAVLJANJE lokacije (klik -> marker) - koristi se pri kreiranju
// dogadjaja. Standardizovano na @vis.gl/react-google-maps (zvanicna React
// biblioteka koju danas Google preporucuje) umesto rucnog window.google.maps.
const Mapa = ({ x, y, onMapMarker }) => {
  const [marker, setMarker] = useState(
    x && y ? { lat: x, lng: y } : null
  );

  const handleClick = useCallback((event) => {
    const latLng = event.detail.latLng;
    if (!latLng) return;
    setMarker(latLng);
    onMapMarker(latLng.lat, latLng.lng);
  }, [onMapMarker]);

  return (
    <Map
      style={{ height: '280px' }}
      defaultCenter={pocetniCentar}
      defaultZoom={7}
      gestureHandling="greedy"
      onClick={handleClick}
      mapId="DEMO_MAP_ID" // AdvancedMarker ne radi bez mapId - zameni pravim iz Cloud Console-a u produkciji
    >
      {marker && <AdvancedMarker position={marker} />}
    </Map>
  );
};

export default Mapa;
