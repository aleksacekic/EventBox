import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Cookies from 'js-cookie';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [connection, setConnection] = useState(null);
  const [korisnik, setKorisnik] = useState(null);
  const [users, setUsers] = useState([]); // Dodaj state za korisnike
  const navigate = useNavigate();

  const korisnik_Id = Cookies.get('userID');

  async function fetchKorisnik(korisnik_Id) {
    try {
      if (!korisnik_Id) return null;
      const response = await fetch(`http://localhost:5153/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
      if (!response.ok) {
        throw new Error(`Greška pri dohvatanju korisnika: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Greška pri dohvaćanju podataka o korisniku:', error);
      return null;
    }
  }

  async function fetchUsers(korisnik_Id) {
    try {
      const response = await fetch(`http://localhost:5153/Korisnik/VratiSveKorisnikeOsim/${korisnik_Id}`);
      if (!response.ok) {
        throw new Error(`Greška pri dohvatanju korisnika: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data); // Postavi korisnike u state
    } catch (error) {
      console.error('Greška pri dohvatanju korisnika:', error);
    }
  }

  useEffect(() => {
    fetchKorisnik(korisnik_Id).then(setKorisnik);
    fetchUsers(korisnik_Id); // Fetch korisnike prilikom učitavanja
  }, []);

  useEffect(() => {
    const connect = async () => {
      const connection = new HubConnectionBuilder()
        .withUrl(`http://localhost:5153/chatHub?userId=${encodeURIComponent(korisnik_Id)}`)
        .build();

      connection.on("ReceiveMessage", (senderId, message) => {
        setMessages(prev => ({
          ...prev,
          [senderId]: [...(prev[senderId] || []), { text: message, sender: "their" }]
        }));
        //console.log(`Primljena poruka od ${senderId}: ${message}`);
      });

      await connection.start();
      setConnection(connection);
    };

    connect();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    if (!messages[user.id]) {
      setMessages((prev) => ({ ...prev, [user.id]: [] }));
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedUser || !connection) return;

    //console.log(`Šaljem poruku korisniku ${selectedUser.id} od korisnika ${korisnik.id}`);
    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [...prev[selectedUser.id], { text: newMessage, sender: "me" }],
    }));

    await connection.invoke("SendMessage", korisnik.id, selectedUser.id, newMessage);
    setNewMessage("");
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  //console.log(users);
  return (
    <div>
      <div>
        <button onClick={handleBackClick} className="back-btn-chat">
          <i className="la la-arrow-left ikonicaback"></i>
        </button>
      </div>
      <div className="chat-container">
        <div className="chat-sidebar">
          <h2>Inbox</h2>
          {users.map((user) => (
            <div
              key={user.id}
              className={`chat-user ${selectedUser?.id === user.id ? "active" : ""}`}
              onClick={() => handleUserClick(user)}
            >
              {user.ime}
            </div>
          ))}
        </div>
        <div className="chat-main">
          {selectedUser ? (
            <>
              <div className="chat-header">{selectedUser.ime}</div>
              <div className="chat-messages">
                {messages[selectedUser.id]?.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender === "me" ? "my-message" : "their-message"}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Napiši poruku..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>Pošalji</button>
              </div>
            </>
          ) : (
            <div className="no-chat">Izaberi korisnika da započneš razgovor</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
