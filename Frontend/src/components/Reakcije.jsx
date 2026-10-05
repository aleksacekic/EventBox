import { api } from '../api';
import { useAuth } from '../auth';
import React, { useState, useEffect } from "react";

// samoPrikaz: zavrsen dogadjaj - bez reagovanja, samo brojevi (prosledjuju se u `brojevi`)
function Reakcije({ dogadjaj_Id, IDucitanidogadjaji, samoPrikaz = false, brojevi }) {
  const { userId } = useAuth();
  // dogadjaj_ID -> tip reakcije ulogovanog korisnika ("Zainteresovan" | "Mozda" | "Nezainteresovan")
  const [aktivneReakcije, setAktivneReakcije] = useState({});
  const aktivniTip = aktivneReakcije[dogadjaj_Id];
  const zainteresovanActive = aktivniTip === "Zainteresovan";
  const mozdaActive = aktivniTip === "Mozda";
  const nisamZainteresovanActive = aktivniTip === "Nezainteresovan";

  useEffect(() => {
    if (samoPrikaz) return;
    const fetchData = async () => {
      try {
        //console.log(IDucitanidogadjaji);
        //const dogadjajiIds = [39, 40, 43]; // Primer niza ID-jeva događaja
        const idKorisnika = userId;

        const queryString = IDucitanidogadjaji.join("%2C");
        const reakcije = await api.get(`/Reakcija/VratiReakcije/${idKorisnika}/${queryString}`);

        if (reakcije) {
          const aktivne = {};
          reakcije.forEach(({ dogadjaj_ID, tip }) => {
            aktivne[dogadjaj_ID] = tip;
          });
          setAktivneReakcije(aktivne);
        }
      } catch (error) {
        console.log("Greška prilikom dohvatanja reakcija:", error);
      }
    };

    fetchData();
  }, [dogadjaj_Id]);

  const handleReactionClick = async (tip) => {
    try {
      const prethodniTip = aktivneReakcije[dogadjaj_Id];
      if (prethodniTip) {
        // Server sam zna prethodni tip; salje se samo zbog oblika rute
        await api.put(`/Reakcija/PromeniReakciju/${prethodniTip}/${tip}/${userId}/${dogadjaj_Id}`);
      } else {
        await api.post(`/Reakcija/PostaviReakciju/${tip}/${userId}/${dogadjaj_Id}`);
      }
      setAktivneReakcije((prev) => ({ ...prev, [dogadjaj_Id]: tip }));
    } catch (error) {
      console.log("Greška prilikom promene reakcije:", error);
    }
  };

  const handleZainteresovanClick = () => {
    handleReactionClick("Zainteresovan");
  };

  const handleMozdaClick = () => {
    handleReactionClick("Mozda");
  };

  const handleNisamZainteresovanClick = () => {
    handleReactionClick("Nezainteresovan");
  };

  if (samoPrikaz) {
    return (
      <div className="dogadjaj-card-reakcije">
        <span className="dogadjaj-card-reakcija-ro dogadjaj-card-reakcija-da">
          Zainteresovanih: {brojevi?.da ?? 0}
        </span>
        <span className="dogadjaj-card-reakcija-ro dogadjaj-card-reakcija-mozda">
          Mozda: {brojevi?.mozda ?? 0}
        </span>
        <span className="dogadjaj-card-reakcija-ro dogadjaj-card-reakcija-ne">
          Nezainteresovanih: {brojevi?.ne ?? 0}
        </span>
      </div>
    );
  }

  return (
    <div className="dogadjaj-card-reakcije">
      <button
        className={`dogadjaj-card-reakcija dogadjaj-card-reakcija-da ${zainteresovanActive ? "is-active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          handleZainteresovanClick();
        }}
      >
        Zainteresovan sam
      </button>
      <button
        className={`dogadjaj-card-reakcija dogadjaj-card-reakcija-mozda ${mozdaActive ? "is-active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          handleMozdaClick();
        }}
      >
        Mozda
      </button>
      <button
        className={`dogadjaj-card-reakcija dogadjaj-card-reakcija-ne ${
          nisamZainteresovanActive ? "is-active" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          handleNisamZainteresovanClick();
        }}
      >
        Nisam zainteresovan
      </button>
    </div>
  );
}

export default Reakcije;
