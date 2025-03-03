import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

function Reakcije({ dogadjaj_Id, IDucitanidogadjaji }) {
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
        const idKorisnika = Cookies.get("userID"); // ID korisnika

        const queryString = IDucitanidogadjaji.join("%2C");
        const url = `http://localhost:5153/Reakcija/VratiReakcije/${idKorisnika}/${queryString}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const reakcije = await response.json();
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
        } else {
          console.log("Greška prilikom dohvatanja reakcija.");
        }
      } catch (error) {
        console.log("Greška prilikom dohvatanja reakcija:", error);
      }
    };

    fetchData();
  }, [dogadjaj_Id]);

  const handleReactionClick = async (tip) => {
    try {
      const korisnik_Id = Cookies.get("userID"); // ID korisnika
      const dogadjaj_id = dogadjaj_Id; // ID događaja

      // Provera da li postoji prethodno označena reakcija
      if (aktivneReakcije[dogadjaj_id]) {
        const prethodnaReakcija = Object.keys(
          aktivneReakcije[dogadjaj_id]
        ).find((reakcija) => aktivneReakcije[dogadjaj_id][reakcija]);

        // Ako postoji prethodna reakcija, koristi PUT metodu
        const url = `http://localhost:5153/Reakcija/PromeniReakciju/${prethodnaReakcija}/${tip}/${korisnik_Id}/${dogadjaj_id}`;

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const updatedAktivneReakcije = {
            ...aktivneReakcije,
            [dogadjaj_id]: { [prethodnaReakcija]: false, [tip]: true },
          };
          setAktivneReakcije(updatedAktivneReakcije);

          // Ažuriranje aktivnog dugmeta
          if (tip === "Zainteresovan") {
            setZainteresovanActive(true);
            setMozdaActive(false);
            setNisamZainteresovanActive(false);
          } else if (tip === "Mozda") {
            setZainteresovanActive(false);
            setMozdaActive(true);
            setNisamZainteresovanActive(false);
          } else if (tip === "Nezainteresovan") {
            setZainteresovanActive(false);
            setMozdaActive(false);
            setNisamZainteresovanActive(true);
          }
        } else {
          console.log("Greška prilikom promene reakcije.");
        }
      } else {
        // Ako ne postoji prethodno označena reakcija, koristi POST metodu
        const url = `http://localhost:5153/Reakcija/PostaviReakciju/${tip}/${korisnik_Id}/${dogadjaj_id}`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Ažuriranje stanja komponente
          const updatedAktivneReakcije = {
            ...aktivneReakcije,
            [dogadjaj_id]: { [tip]: true },
          };
          setAktivneReakcije(updatedAktivneReakcije);

          // Ažuriranje aktivnog dugmeta
          if (tip === "Zainteresovan") {
            setZainteresovanActive(true);
            setMozdaActive(false);
            setNisamZainteresovanActive(false);
          } else if (tip === "Mozda") {
            setZainteresovanActive(false);
            setMozdaActive(true);
            setNisamZainteresovanActive(false);
          } else if (tip === "Nezainteresovan") {
            setZainteresovanActive(false);
            setMozdaActive(false);
            setNisamZainteresovanActive(true);
          }
        } else {
          console.log("Greška prilikom postavljanja reakcije.");
        }
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
