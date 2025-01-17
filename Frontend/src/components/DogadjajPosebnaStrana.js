import React from 'react'
import HideShowMapa from './Hide&ShowMapa';
import Reakcije from './Reakcije';
import Komentari from './Komentari';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

function DogadjajPosebnaStrana() {
    const [dogadjaj, setDogadjaj] = useState({});
    const { id } = useParams(); // dobija `id` iz URL-a

    const navigate = useNavigate();
    const handleBackClick = () => {
        navigate(-1); // -1 vraća na prethodnu stranicu
      };

  return (
    <div>
    <button onClick={handleBackClick} style={{ margin: '10px', padding: '5px 10px' }}>
        Vrati se nazad
      </button>
      <h1>Dogadjaj ID: {id}</h1>
    </div>
  )
}

export default DogadjajPosebnaStrana


