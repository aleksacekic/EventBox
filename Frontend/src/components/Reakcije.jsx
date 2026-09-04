import { api } from '../api';
import { useAuth } from '../auth';
import React, { useState, useEffect } from "react";

function Reakcije({ dogadjaj_Id, IDucitanidogadjaji }) {
  const { userId } = useAuth();
  const [zainteresovanActive, setZainteresovanActive] = useState(false);
  const [mozdaActive, setMozdaActive] = useState(false);
  const [nisamZainteresovanActive, setNisamZainteresovanActive] =
    useState(false);
  const [aktivneReakcije, setAktivneReakcije] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        //console.log(IDucitanidogadjaji);
        //const dogadjajiIds = [39, 40, 43]; // Primer niza ID-jeva događaja
        const idKorisnika = userId;

        const queryString = IDucitanidogadjaji.join("%2C");
        const reakcije = await api.get(`/Reakcija/VratiReakcije/${idKorisnika}/${queryString}`);

        if (reakcije) {
          //console.log(reakcije);
          // Inicijalizacija objekta za praćenje aktivnih reakcija
          const activeReakcije = {};

          // Postavljanje aktivnih reakcija na osnovu vraćenih podataka
          reakcije.forEach((reakcija) => {
            const { dogadjaj_ID, tip } = reakcija;
            if (!activeReakcije[dogadjaj_ID]) {
              activeReakcije[dogadjaj_ID] = {
                zainteresovan: false,
                mozda: false,
                nezainteresovan: false,
              };
            }

            if (tip === "Zainteresovan") {
              activeReakcije[dogadjaj_ID].zainteresovan = true;
            } else if (tip === "Mozda") {
              activeReakcije[dogadjaj_ID].mozda = true;
            } else if (tip === "Nezainteresovan") {
              activeReakcije[dogadjaj_ID].nezainteresovan = true;
            }
          });

          // Azuriranje stanja komponente
          setAktivneReakcije(activeReakcije);

          // Provera za trenutni događaj_Id i ažuriranje stanja dugmića
          if (activeReakcije[dogadjaj_Id]) {
            const { zainteresovan, mozda, nezainteresovan } =
              activeReakcije[dogadjaj_Id];
            setZainteresovanActive(zainteresovan);
            setMozdaActive(mozda);
            setNisamZainteresovanActive(nezainteresovan);
          } else {
            // Ako ne postoji reakcija za trenutni događaj_Id, resetujte stanje dugmića
            setZainteresovanActive(false);
            setMozdaActive(false);
            setNisamZainteresovanActive(false);
          }
        }
      } catch (error) {
        console.log("Greška prilikom dohvatanja reakcija:", error);
      }
    };

    fetchData();
  }, [dogadjaj_Id]);

  // Postavi koje je dugme aktivno (samo jedno moze biti)
  const postaviAktivnoDugme = (tip) => {
    setZainteresovanActive(tip === "Zainteresovan");
    setMozdaActive(tip === "Mozda");
    setNisamZainteresovanActive(tip === "Nezainteresovan");
  };

  const handleReactionClick = async (tip) => {
    try {
      const korisnik_Id = userId;
      const dogadjaj_id = dogadjaj_Id; // ID događaja

      // Provera da li postoji prethodno označena reakcija
      if (aktivneReakcije[dogadjaj_id]) {
        const prethodnaReakcija = Object.keys(
          aktivneReakcije[dogadjaj_id]
        ).find((reakcija) => aktivneReakcije[dogadjaj_id][reakcija]);

        // Ako postoji prethodna reakcija, koristi PUT metodu
        await api.put(`/Reakcija/PromeniReakciju/${prethodnaReakcija}/${tip}/${korisnik_Id}/${dogadjaj_id}`);

        setAktivneReakcije({
          ...aktivneReakcije,
          [dogadjaj_id]: { [prethodnaReakcija]: false, [tip]: true },
        });
        postaviAktivnoDugme(tip);
      } else {
        // Ako ne postoji prethodno označena reakcija, koristi POST metodu
        await api.post(`/Reakcija/PostaviReakciju/${tip}/${korisnik_Id}/${dogadjaj_id}`);

        setAktivneReakcije({
          ...aktivneReakcije,
          [dogadjaj_id]: { [tip]: true },
        });
        postaviAktivnoDugme(tip);
      }
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

  return (
    <div>
      <div className="divreakcije">
        <button
          className={`zainteresovan ${zainteresovanActive ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleZainteresovanClick();
          }}
        >
          Zainteresovan sam
        </button>
        <button
          className={`mozda ${mozdaActive ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleMozdaClick();
          }}
        >
          Mozda
        </button>
        <button
          className={`nisamzainteresovan ${
            nisamZainteresovanActive ? "active" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleNisamZainteresovanClick();
          }}
        >
          Nisam zainteresovan
        </button>
      </div>
    </div>
  );
}

export default Reakcije;
