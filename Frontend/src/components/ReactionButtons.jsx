import { api } from '../api';
import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

// samoPrikaz: zavrsen dogadjaj - bez reagovanja, samo brojevi (prosledjuju se u `brojevi`)
function ReactionButtons({ dogadjaj_Id, IDucitanidogadjaji, samoPrikaz = false, brojevi }) {
  const { t } = useTranslation();
  // dogadjaj_ID -> tip reakcije ulogovanog korisnika ("Zainteresovan" | "Mozda" | "Nezainteresovan")
  const [aktivneReakcije, setAktivneReakcije] = useState({});
  const aktivniTip = aktivneReakcije[dogadjaj_Id];
  const zainteresovanActive = aktivniTip === "Zainteresovan";
  const mozdaActive = aktivniTip === "Mozda";
  const nisamZainteresovanActive = aktivniTip === "Nezainteresovan";

  useEffect(() => {
    if (samoPrikaz) return;
    const loadReactions = async () => {
      try {
        //console.log(IDucitanidogadjaji);
        //const dogadjajiIds = [39, 40, 43]; // Primer niza ID-jeva događaja
        // Server zna ko je korisnik iz tokena, pa se salju samo ID-jevi dogadjaja
        const reakcije = await api.get(`/api/reactions/mine?eventIds=${IDucitanidogadjaji.join(",")}`);

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

    loadReactions();
  }, [dogadjaj_Id]);

  const handleReactionClick = async (tip) => {
    try {
      // PUT postavlja reakciju ili menja postojecu (server zna koja je bila)
      await api.put(`/api/events/${dogadjaj_Id}/reaction`, { tip });
      setAktivneReakcije((prev) => ({ ...prev, [dogadjaj_Id]: tip }));
    } catch (error) {
      console.log("Greška prilikom promene reakcije:", error);
    }
  };

  const handleInterestedClick = () => {
    handleReactionClick("Zainteresovan");
  };

  const handleMaybeClick = () => {
    handleReactionClick("Mozda");
  };

  const handleNotInterestedClick = () => {
    handleReactionClick("Nezainteresovan");
  };

  if (samoPrikaz) {
    return (
      <div className="dogadjaj-card-reakcije">
        <span className="dogadjaj-card-reakcija-ro dogadjaj-card-reakcija-da">
          {t('reactions.interestedCount', { n: brojevi?.da ?? 0 })}
        </span>
        <span className="dogadjaj-card-reakcija-ro dogadjaj-card-reakcija-mozda">
          {t('reactions.maybeCount', { n: brojevi?.mozda ?? 0 })}
        </span>
        <span className="dogadjaj-card-reakcija-ro dogadjaj-card-reakcija-ne">
          {t('reactions.notInterestedCount', { n: brojevi?.ne ?? 0 })}
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
          handleInterestedClick();
        }}
      >
        {t('reactions.interested')}
      </button>
      <button
        className={`dogadjaj-card-reakcija dogadjaj-card-reakcija-mozda ${mozdaActive ? "is-active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          handleMaybeClick();
        }}
      >
        {t('reactions.maybe')}
      </button>
      <button
        className={`dogadjaj-card-reakcija dogadjaj-card-reakcija-ne ${
          nisamZainteresovanActive ? "is-active" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          handleNotInterestedClick();
        }}
      >
        {t('reactions.notInterested')}
      </button>
    </div>
  );
}

export default ReactionButtons;
