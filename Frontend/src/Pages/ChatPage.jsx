import { api, API_BASE } from '../api';
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth";
import { useNotifications } from "../notifications";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import InfiniteScrollFooter from "../components/InfiniteScrollFooter";
import { useInfiniteList } from "../useInfiniteList";

// Server salje vreme u UTC (vidi utils/date.js); lokalne poruke su ISO stringovi
import { formatTime } from "../utils/date";

const fullName = (u) => `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();

function Avatar({ user, className = "" }) {
  return user.profileImage ? (
    <img
      className={`poruke-avatar ${className}`}
      src={`${API_BASE}/resources/${user.profileImage}`}
      alt=""
    />
  ) : (
    <span className={`poruke-avatar poruke-avatar-inicijal ${className}`}>
      {(user.firstName || user.username || "?").charAt(0)}
    </span>
  );
}

const ChatPage = () => {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState(null); //trenutno izabrani korisnik za chat
  const [newMessage, setNewMessage] = useState(""); //nasa poruka u input polju
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
  // (vidi useInfiniteList, direction 'up'). Lista je od starijih ka novijim.
  const lista = useInfiniteList(
    selectedUser ? `/api/conversations/${selectedUser.id}/messages` : null,
    { limit: 20, direction: 'up' }
  );
  const poruke = selectedUser ? lista.items : [];

  const izabraniIdRef = useRef(null);
  izabraniIdRef.current = selectedUser?.id ?? null;

  // Skrol: otvaranje razgovora -> na dno; starije poruke -> ostajemo na istom mestu;
  // nova poruka -> na dno ako je moja ili ako smo vec bili pri dnu (inace ne cupamo korisnika
  // iz istorije koju cita).
  const skrolRef = useRef({ prvi: null, zadnji: null, visina: 0 });
  const priDnuRef = useRef(true);
  const messageKey = (m) => (m ? (m.lokalniId ?? m.id) : null);

  useLayoutEffect(() => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const p = skrolRef.current;
    const prvi = messageKey(poruke[0]);
    const zadnji = messageKey(poruke[poruke.length - 1]);
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
  }, [lista.items]);

  useEffect(() => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const onScroll = () => {
      priDnuRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedUser?.id]);
  async function fetchUser(korisnik_Id) {
    try {
      if (!korisnik_Id) return null;
      return await api.get(`/api/users/${korisnik_Id}`);
    } catch (error) {
      console.error("Greska pri dohvatanju podataka o korisniku:", error);
      return null;
    }
  }

  async function fetchUsers() {
    try {
      const data = await api.get('/api/users');
      setSviKorisnici(data); // Postavi korisnike u state
    } catch (error) {
      console.error("Greska pri dohvatanju korisnika:", error);
    }
  }

  async function fetchChatUsers() {
    try {
      // 1. dohvati ID-jeve korisnika sa kojima je kuminicirano
      const userIds = await api.get('/api/conversations');

      if (userIds.length === 0) {
        setUsers([]); // ako nema korisnika, postavi prazan niz, zavrsi funkciju
        return;
      }

      // 2. fetchUser za svaki od IDjeva, i cekaj da se zavrse!
      const userPromises = userIds.map((id) => fetchUser(id));
      const usersData = await Promise.all(userPromises);

      // 3. filtracija null vrednosti ako neki poziv nije uspeo
      setUsers(usersData.filter((user) => user !== null));
    } catch (error) {
      console.error("Greska pri dohvatanju korisnika:", error);
    }
  }

  useEffect(() => {
    fetchUser(korisnik_Id).then(setKorisnik);
    fetchChatUsers();
    fetchUsers();
  }, []);

  // Nove poruke stizu kroz zajednicku SignalR konekciju (src/notifications.jsx), tek posto ih
  // server sacuva. Poruka za otvoren razgovor se odmah prikaze i oznaci kao procitana;
  // za ostale razgovore kontakt dobija oznaku "Nova".
  const { subscribeToMessages, setUnreadCount } = useNotifications();

  const markAsRead = async (posiljaocId) => {
    try {
      const odgovor = await api.put(`/api/conversations/${posiljaocId}/read`);
      if (odgovor && typeof odgovor.unreadCount === "number") setUnreadCount(odgovor.unreadCount);
    } catch (error) {
      console.error("Oznacavanje poruka kao procitanih nije uspelo:", error);
    }
  };

  useEffect(() => {
    return subscribeToMessages((poruka) => {
      const od = poruka.senderId;
      if (String(od) === String(izabraniIdRef.current)) {
        lista.setItems((prev) => (prev.some((m) => m.id === poruka.id) ? prev : [...prev, poruka]));
        markAsRead(od);
      } else {
        setMessageSenders((prev) => (prev.includes(od) ? prev : [od, ...prev]));
        // posiljalac koji nije u listi razgovora (prva poruka od njega) - dodaj ga
        setUsers((prev) => {
          if (prev.some((u) => u.id === od)) return prev;
          fetchUser(od).then((u) => u && setUsers((p) => (p.some((x) => x.id === u.id) ? p : [u, ...p])));
          return prev;
        });
      }
    });
  }, [subscribeToMessages]);

  const handleUserClick = (user) => {
    // Klik na vec otvoren razgovor ne sme da ga resetuje (effect za ucitavanje poruka
    // se ne bi ponovo pokrenuo i ostala bi prazna lista)
    if (selectedUser?.id === user.id) {
      setMessageSenders((prev) => prev.filter((id) => id !== user.id));
      markAsRead(user.id);
      return;
    }
    setSelectedUser(user);
    setMessageSenders((prev) => prev.filter((id) => id !== user.id));
    markAsRead(user.id);
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

  const handleMarkRead = (user) => {
    markAsRead(user.id);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (newMessage.trim() === "" || !selectedUser) return;

    const tekst = newMessage;
    const lokalniId = `l${Date.now()}${Math.random()}`;
    const primalac = selectedUser.id;
    setNewMessage("");
    lista.setItems((prev) => [
      ...prev,
      { lokalniId, content: tekst, sender: "me", sentAt: new Date().toISOString() },
    ]);

    try {
      // Server sacuva poruku i tek onda je posalje primaocu uzivo
      const sacuvana = await api.post(`/api/conversations/${primalac}/messages`, { content: tekst });
      if (String(izabraniIdRef.current) === String(primalac)) {
        lista.setItems((prev) => prev.map((m) => (m.lokalniId === lokalniId ? { ...sacuvana, lokalniId } : m)));
      }
      // novi razgovor se pojavi u listi kontakata
      setUsers((prev) => (prev.some((u) => u.id === selectedUser.id) ? prev : [selectedUser, ...prev]));
    } catch (error) {
      console.error("Slanje poruke nije uspelo:", error);
      lista.setItems((prev) => prev.map((m) => (m.lokalniId === lokalniId ? { ...m, neuspela: true } : m)));
    }
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
      const data = await api.get(`/api/users/search?query=${encodeURIComponent(searchValue)}`);
      setSearchResults(Array.isArray(data) ? data : []);
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
        const data = await api.get(`/api/users/search?query=${encodeURIComponent(searchValue)}`);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Greška prilikom pretrage:", error);
      }
    }

    searchUsers();
  }, [searchValue]);

  const openChat = (id) => {
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
          <i className="la la-arrow-left" /> {t('common.back')}
        </button>

        <div className={`poruke-card ${selectedUser ? "has-chat" : ""}`}>
          <div className="poruke-list">
            <div className="poruke-list-head">
              <h2>{t('chat.title')}</h2>
              <button
                type="button"
                onClick={toggleSearch}
                className={`poruke-new ${showSearch ? "is-open" : ""}`}
                aria-label={t('chat.newMessage')}
                title={t('chat.newMessage')}
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
                    placeholder={t('header.searchUsers')}
                    aria-label={t('header.searchUsersLabel')}
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
                        <button type="button" onClick={() => openChat(result.id)}>
                          <Avatar user={result} />
                          <span className="poruke-contact-text">
                            <strong>{fullName(result)}</strong>
                            <small>@{result.username}</small>
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
                  {t('chat.noConversations')}
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
                      <strong>{fullName(user)}</strong>
                      <small>@{user.username}</small>
                    </span>
                    {nova && <span className="poruke-nova">{t('chat.new')}</span>}
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
                    aria-label={t('chat.backToList')}
                  >
                    <i className="la la-arrow-left" />
                  </button>
                  <Link to={`/profilkorisnika/${selectedUser.id}`} className="poruke-chat-user">
                    <Avatar user={selectedUser} />
                    <span className="poruke-contact-text">
                      <strong>{fullName(selectedUser)}</strong>
                      <small>@{selectedUser.username}</small>
                    </span>
                  </Link>
                </div>

                <div className="poruke-messages" ref={chatMessagesRef}>
                  <InfiniteScrollFooter lista={lista} gore />
                  {!lista.initialLoading && !lista.loading && !lista.error && poruke.length === 0 && (
                    <div className="poruke-messages-empty">
                      {t('chat.noMessages')}
                    </div>
                  )}
                  {poruke.map((msg) => (
                    <div
                      key={messageKey(msg)}
                      className={`poruke-msg ${
                        msg.senderId === korisnik?.id || msg.sender === "me"
                          ? "is-mine"
                          : "is-theirs"
                      }`}
                    >
                      {msg.content}
                      <span className="poruke-time">
                        {msg.neuspela ? t('chat.notSent') : formatTime(msg.sentAt)}
                      </span>
                    </div>
                  ))}
                </div>

                <form className="poruke-composer" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder={t('chat.placeholder')}
                    aria-label={t('chat.messageLabel')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={() => handleMarkRead(selectedUser)}
                  />
                  <button type="submit" aria-label={t('chat.send')} disabled={!newMessage.trim()}>
                    <i className="la la-paper-plane" />
                  </button>
                </form>
              </>
            ) : (
              <div className="poruke-empty">
                <i className="la la-comments-o" />
                <h3>{t('chat.emptyTitle')}</h3>
                <p>{t('chat.emptyText')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
