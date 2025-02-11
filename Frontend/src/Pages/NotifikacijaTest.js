import React, { useState, useEffect} from 'react';

const NotifikacijaTest = () => {
  const [notifikacijaId, setNotifikacijaId] = useState("");
  const baseUrl = "http://localhost:5153"; 


   const [notifikacije, setNotifikacije] = useState([]);
 
 
  const postaviNotifikaciju = async () => {
    const korisnikReagujeId = 9;
    const tipReakcije = "JOJ";
    const sadrzajReakcije = "kaludjeruu";
    const vreme = new Date().toISOString().slice(0, 19);
    const korisnikId = 8;

    const url = `${baseUrl}/Notifikacija/PostaviNotifikaciju/${korisnikReagujeId}/${tipReakcije}/${sadrzajReakcije}/${vreme}/${korisnikId}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.text();
      alert(data);
    } catch (error) {
      alert("Greška: " + error);
    }
  };


  const izbrisiNotifikaciju = async () => {
    if (!notifikacijaId) {
      alert("Unesi ID notifikacije!");
      return;
    }

    const url = `${baseUrl}/Notifikacija/IzbrisiNotifikaciju/${notifikacijaId}`;

    try {
      const response = await fetch(url, {
        method: "DELETE",
      });
      const data = await response.text();
      alert(data);
    } catch (error) {
      alert("Greška: " + error);
    }
  };

  const fetchNotifikacije = async () =>
    {
        const response = await fetch(`${baseUrl}/Korisnik/VratiNotifikacijeKorisnika/9`);
        const data = await response.json();
        setNotifikacije(data);
    }

    useEffect(() => {
        fetchNotifikacije();
      }, []);

      console.log(notifikacije);

  return (
    <div>
      <h2>Testiranje Notifikacija</h2>
      <button onClick={postaviNotifikaciju}>Dodaj Notifikaciju</button>
      <br /><br />
      <input
        type="number"
        placeholder="Unesi ID za brisanje"
        value={notifikacijaId}
        onChange={(e) => setNotifikacijaId(e.target.value)}
      />
      <button onClick={izbrisiNotifikaciju}>Izbriši Notifikaciju</button>

      <div>
      {notifikacije.map((not,index) => (
        <div key={index}>
          <h3>{not.tipReakcije}</h3>
          <p>{not.sadrzajReakcije}</p>
        </div>
      ))}
      </div>
    </div>
  );
};

export default NotifikacijaTest;
