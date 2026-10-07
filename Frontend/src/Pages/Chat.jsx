import { api, API_BASE } from '../api';
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useAuth } from "../auth";
import Header from "../components/Header";
import KrajListe from "../components/KrajListe";
import { useBeskonacnaLista } from "../useBeskonacnaLista";

// Server salje vreme bez oznake zone (UTC); lokalne poruke su ISO stringovi.
const uDatum = (vreme) => {
  if (!vreme) return null;
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(vreme)) return new Date(vreme);
  const d = new Date(vreme + "Z");
  return isNaN(d) ? new Date(vreme) : d;
};

const formatVreme = (vreme) => {
  const d = uDatum(vreme);
  if (!d || isNaN(d)) return "";
  return d.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const imePrezime = (u) => `${u.ime ?? ""} ${u.prezime ?? ""}`.trim();

function Avatar({ user, className = "" }) {
  return user.korisnikImage ? (
    <img
      className={`poruke-avatar ${className}`}
      src={`${API_BASE}/resources/${user.korisnikImage}`}
      alt=""
    />
  ) : (
    <span className={`poruke-avatar poruke-avatar-inicijal ${className}`}>
      {(user.ime || user.korisnicko_Ime || "?").charAt(0)}
    </span>
  );
}

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null); //trenutno izabrani korisnik za chat
  const [newMessage, setNewMessage] = useState(""); //nasa poruka u input polju
  const [connection, setConnection] = useState(null); //singlaR konekcija
  const [users, setUsers] = useState([]); //lista korisnika koji su dostupni za chat
  const [messageSenders, setMessageSenders] = useState([]); //korisnici koji su poslali novu poruku
  const [korisnik, setKorisnik] = useState(null); //trenutno ulogovani korisnik
  const [showSearch, setShowSearch] = useState(false); //bool za prikaz pretrage korisnika za novu poruku
  const [sviKorisnici, setSviKorisnici] = useState([]); //svi korisnici

  const chatMessagesRef = useRef(null);

  const navigate = useNavigate();
  const { userId } = useAuth();
  const korisnik_Id = userId;

  // Poruke izabranog razgovora: ucitava se najnovijih 20, a starije kad se skroluje nagore
  // (vidi useBeskonacnaLista, smer 'gore'). Lista je od starijih ka novijim.
  const lista = useBeskonacnaLista(
    selectedUser ? `/Poruka/VratiPoruke/${korisnik_Id}/${selectedUser.id}` : null,
    { limit: 20, smer: 'gore' }
  );
  const poruke = selectedUser ? lista.stavke : [];

  const izabraniIdRef = useRef(null);
  izabraniIdRef.current = selectedUser?.id ?? null;

  // Skrol: otvaranje razgovora -> na dno; starije poruke -> ostajemo na istom mestu;
  // nova poruka -> na dno ako je moja ili ako smo vec bili pri dnu (inace ne cupamo korisnika
  // iz istorije koju cita).
  const skrolRef = useRef({ prvi: null, zadnji: null, visina: 0 });
  const priDnuRef = useRef(true);
  const kljucPoruke = (m) => (m ? (m.id ?? m.lokalniId) : null);

  useLayoutEffect(() => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const p = skrolRef.current;
    const prvi = kljucPoruke(poruke[0]);
    const zadnji = kljucPoruke(poruke[poruke.length - 1]);
    if (prvi === null) {
      skrolRef.current = { prvi: null, zadnji: null, visina: 0 };
      priDnuRef.current = true;
      return;
    }
    if (p.prvi === null) {
      el.scrollTop = el.scrollHeight;
    } else if (prvi !== p.prvi && zadnji === p.zadnji) {
      el.scrollTop += el.scrollHeight - p.visina;
    } else if (zadnji !== p.zadnji && (priDnuRef.current || poruke[poruke.length - 1].sender === 'me')) {
      el.scrollTop = el.scrollHeight;
    }
    skrolRef.current = { prvi, zadnji, visina: el.scrollHeight };
  }, [lista.stavke]);

  useEffect(() => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const onScroll = () => {
      priDnuRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedUser?.id]);
  async function fetchKorisnik(korisnik_Id) {
    try {
      if (!korisnik_Id) return null;
      return await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
    } catch (error) {
      console.error("Greska pri dohvatanju podataka o korisniku:", error);
      return null;
    }
  }

  async function fetchUsers(korisnik_Id) {
    try {
      const data = await api.get(`/Korisnik/VratiSveKorisnikeOsim/${korisnik_Id}`);
      setSviKorisnici(data); // Postavi korisnike u state
    } catch (error) {
      console.error("Greska pri dohvatanju korisnika:", error);
    }
  }

  async function fetchChatUsers(korisnik_Id) {
    try {
      // 1. dohvati ID-jeve korisnika sa kojima je kuminicirano
      const userIds = await api.get(`/Poruka/VratiKorisnikeSaMogChata/${korisnik_Id}`);

      if (userIds.length === 0) {
        setUsers([]); // ako nema korisnika, postavi prazan niz, zavrsi funkciju
        return;
      }

      // 2. fetchKorisnik za svaki od IDjeva, i cekaj da se zavrse!
      const userPromises = userIds.map((id) => fetchKorisnik(id));
      const usersData = await Promise.all(userPromises);

      // 3. filtracija null vrednosti ako neki poziv nije uspeo
      setUsers(usersData.filter((user) => user !== null));
    } catch (error) {
      console.error("Greska pri dohvatanju korisnika:", error);
    }
  }

  useEffect(() => {
    fetchKorisnik(korisnik_Id).then(setKorisnik);
    fetchChatUsers(korisnik_Id);
    fetchUsers(korisnik_Id);
  }, []);

  useEffect(() => {
    // Lokalna promenljiva (ne state) - cleanup mora da zaustavi bas ovu konekciju.
    // `ugasena`: StrictMode (dev) montira efekat dvaput, prva konekcija se gasi
    // usred pregovaranja - to nije greska.
    let conn = null;
    let ugasena = false;

    const connect = async () => {
      conn = new HubConnectionBuilder()
        .withUrl(`${API_BASE}/chatHub?userId=${encodeURIComponent(korisnik_Id)}`)
        .build();

      conn.on("ReceiveMessage", (senderId, message) => {
        // Poruka za razgovor koji nije otvoren se ne cuva ovde: cim se otvori, ucitava se sa servera
        if (String(senderId) === String(izabraniIdRef.current)) {
          lista.setStavke((prev) => [
            ...prev,
            {
              lokalniId: `l${Date.now()}${Math.random()}`,
              sadrzaj: message,
              sender: "their",
              vreme: new Date().toISOString(),
            },
          ]);
        }

        setMessageSenders((prev) =>
          prev.includes(senderId) ? prev : [senderId, ...prev]
        );
      });

      try {
        await conn.start();
        if (!ugasena) setConnection(conn);
      } catch (err) {
        if (!ugasena) console.error("SignalR (chat) konekcija nije uspela:", err);
      }
    };
    connect();

    return () => {
      ugasena = true;
      if (conn) conn.stop();
    };
  }, []);

  const handleUserClick = (user) => {
    // Klik na vec otvoren razgovor ne sme da ga resetuje (effect za ucitavanje poruka
    // se ne bi ponovo pokrenuo i ostala bi prazna lista)
    if (selectedUser?.id === user.id) {
      setMessageSenders((prev) => prev.filter((id) => id !== user.id));
      api.put(`/Poruka/OznaciKaoProcitano/${user.id}/${korisnik_Id}`);
      return;
    }
    setSelectedUser(user);
    setMessageSenders((prev) => prev.filter((id) => id !== user.id));
    api.put(`/Poruka/OznaciKaoProcitano/${user.id}/${korisnik_Id}`);
  };

  // /chat?korisnik=<id> (npr. dugme "Posalji poruku" na profilu) otvara razgovor sa tim korisnikom
  const [searchParams] = useSearchParams();
  const ciljniId = searchParams.get("korisnik");
  const ciljOtvoren = useRef(false);
  useEffect(() => {
    if (!ciljniId || ciljOtvoren.current || sviKorisnici.length === 0) return;
    const cilj = sviKorisnici.find((user) => String(user.id) === ciljniId);
    if (!cilj) return;
    ciljOtvoren.current = true;
    handleUserClick(cilj);
  }, [ciljniId, sviKorisnici]);

  const handleProcitaj = (user) => {
    api.put(`/Poruka/OznaciKaoProcitano/${user.id}/${korisnik_Id}`);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (newMessage.trim() === "" || !selectedUser || !connection) return;

    const tekst = newMessage;
    setNewMessage("");
    lista.setStavke((prev) => [
      ...prev,
      {
        lokalniId: `l${Date.now()}${Math.random()}`,
        sadrzaj: tekst,
        sender: "me",
        vreme: new Date().toISOString(),
      },
    ]);

    await connection.invoke("SendMessage", korisnik.id, selectedUser.id, tekst);
    await api.post(
      `/Poruka/PosaljiPoruku/${selectedUser.id}/${korisnik_Id}`,
      { poruka: tekst }
    );
  };

  // Izabrani korisnik se uvek vidi u listi, i kad sa njim jos nije bilo poruka
  const chatKorisnici =
    selectedUser && !users.some((user) => user.id === selectedUser.id)
      ? [selectedUser, ...users]
      : users;

  const sortedUsers = [
    ...messageSenders
      .map((id) => chatKorisnici.find((user) => user.id === id))
      .filter(Boolean),
    ...chatKorisnici.filter((user) => !messageSenders.includes(user.id)),
  ];

  const toggleSearch = () => {
    setShowSearch((prev) => !prev);
  };

  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef();

  async function handleSearchSubmit(e) {
    e.preventDefault();

    try {
      const data = await api.get(`/Korisnik/VratiKorisnikeSearch/${searchValue}`);
      if (data.kraj === "KRAJ") {
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Greška prilikom pretrage:", error);
    }
  }

  useEffect(() => {
    async function searchUsers() {
      if (searchValue === "") {
        setSearchResults([]);
        return;
      }

      try {
        const data = await api.get(`/Korisnik/VratiKorisnikeSearch/${searchValue}`);
        if (data.kraj === "KRAJ") {
          setSearchResults([]);
        } else {
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Greška prilikom pretrage:", error);
      }
    }

    searchUsers();
  }, [searchValue]);

  const otvoriChat = (id) => {
    const user = sviKorisnici.find((u) => u.id === id);
    if (user) handleUserClick(user);
    setSearchResults([]);
    setSearchValue("");
    setShowSearch(false);
  };

  return (
    <div className="poruke-page">
      <Header />
      <div className="container poruke-wrap">
        <button type="button" onClick={() => navigate(-1)} className="poruke-back">
          <i className="la la-arrow-left" /> Nazad
        </button>

        <div className={`poruke-card ${selectedUser ? "has-chat" : ""}`}>
          <div className="poruke-list">
            <div className="poruke-list-head">
              <h2>Poruke</h2>
              <button
                type="button"
                onClick={toggleSearch}
                className={`poruke-new ${showSearch ? "is-open" : ""}`}
                aria-label="Nova poruka"
                title="Nova poruka"
              >
                <i className={`la ${showSearch ? "la-times" : "la-plus"}`} />
              </button>
            </div>

            {showSearch && (
              <div className="poruke-search" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <i className="la la-search" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Pretrazi korisnike..."
                    aria-label="Pretrazi korisnike"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                </form>
                {searchResults.length > 0 && (
                  <ul className="poruke-search-results">
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button type="button" onClick={() => otvoriChat(result.id)}>
                          <Avatar user={result} />
                          <span className="poruke-contact-text">
                            <strong>{imePrezime(result)}</strong>
                            <small>@{result.korisnicko_Ime}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="poruke-contacts">
              {sortedUsers.length === 0 && (
                <p className="poruke-contacts-empty">
                  Jos nemas razgovora. Klikni + da zapocnes novi.
                </p>
              )}
              {sortedUsers.map((user) => {
                const nova = messageSenders.includes(user.id);
                return (
                  <button
                    type="button"
                    key={user.id}
                    className={`poruke-contact ${selectedUser?.id === user.id ? "is-active" : ""}`}
                    onClick={() => handleUserClick(user)}
                  >
                    <Avatar user={user} />
                    <span className="poruke-contact-text">
                      <strong>{imePrezime(user)}</strong>
                      <small>@{user.korisnicko_Ime}</small>
                    </span>
                    {nova && <span className="poruke-nova">Nova</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="poruke-chat">
            {selectedUser ? (
              <>
                <div className="poruke-chat-head">
                  <button
                    type="button"
                    className="poruke-chat-back"
                    onClick={() => setSelectedUser(null)}
                    aria-label="Nazad na listu razgovora"
                  >
                    <i className="la la-arrow-left" />
                  </button>
                  <Link to={`/profilkorisnika/${selectedUser.id}`} className="poruke-chat-user">
                    <Avatar user={selectedUser} />
                    <span className="poruke-contact-text">
                      <strong>{imePrezime(selectedUser)}</strong>
                      <small>@{selectedUser.korisnicko_Ime}</small>
                    </span>
                  </Link>
                </div>

                <div className="poruke-messages" ref={chatMessagesRef}>
                  <KrajListe lista={lista} gore />
                  {!lista.pocetno && !lista.ucitava && !lista.greska && poruke.length === 0 && (
                    <div className="poruke-messages-empty">
                      Jos nema poruka. Napisi prvu!
                    </div>
                  )}
                  {poruke.map((msg) => (
                    <div
                      key={kljucPoruke(msg)}
                      className={`poruke-msg ${
                        msg.posiljaocId === korisnik?.id || msg.sender === "me"
                          ? "is-mine"
                          : "is-theirs"
                      }`}
                    >
                      {msg.sadrzaj}
                      <span className="poruke-time">{formatVreme(msg.vreme)}</span>
                    </div>
                  ))}
                </div>

                <form className="poruke-composer" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Napisi poruku..."
                    aria-label="Poruka"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={() => handleProcitaj(selectedUser)}
                  />
                  <button type="submit" aria-label="Posalji" disabled={!newMessage.trim()}>
                    <i className="la la-paper-plane" />
                  </button>
                </form>
              </>
            ) : (
              <div className="poruke-empty">
                <i className="la la-comments-o" />
                <h3>Tvoje poruke</h3>
                <p>Izaberi razgovor sa liste ili zapocni novi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
