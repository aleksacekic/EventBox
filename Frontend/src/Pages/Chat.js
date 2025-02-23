import React, { useState, useEffect,  useRef  } from "react";
import { useNavigate } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Cookies from 'js-cookie';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [connection, setConnection] = useState(null);
  const [users, setUsers] = useState([]);
  const [messageSenders, setMessageSenders] = useState([]);
  const [korisnik, setKorisnik] = useState(null);
  const [timeVisibility, setTimeVisibility] = useState({});



  //ZA SKROL NA DNO
  const messagesEndRef = useRef(null); 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom(); // Pozovi funkciju za skrolovanje
  }, [messages[selectedUser?.id]]); // Kada se poruke promene  

  //
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

  //-------TRENUTNO----------
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
    

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       const response = await fetch(`http://localhost:5153/Korisnik/VratiKorisnikeSaMogChata/${korisnik_Id}`);
  //       if (!response.ok) throw new Error("Greška pri dohvatanju korisnika");
  //       setUsers(await response.json());
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };
  //   fetchUsers();
  // }, []);

  useEffect(() => {
    const connect = async () => {
      const connection = new HubConnectionBuilder()
        .withUrl(`http://localhost:5153/chatHub?userId=${encodeURIComponent(korisnik_Id)}`)
        .build();

      connection.on("ReceiveMessage", (senderId, message) => {
        setMessages(prev => ({
          ...prev,
          [senderId]: [...(prev[senderId] || []), { sadrzaj: message, sender: "their", vreme: new Date().toLocaleString() }]
        }));

        setMessageSenders(prev => prev.includes(senderId) ? prev : [senderId, ...prev]);
      });

      await connection.start();
      setConnection(connection);
    };
    connect();
    return () => connection && connection.stop();
  }, []);

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5153/Poruka/VratiPoruke/${korisnik_Id}/${userId}`);
      //console.log(response);
      if (!response.ok) throw new Error("Greška pri dohvatanju poruka");
      
      const messagesData = await response.json();
      //console.log(messagesData)
      setMessages(prev => ({ ...prev, [userId]: messagesData }));
    } catch (error) {
      console.error(error);
    }
  };

  

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchMessages(user.id);
    setMessageSenders(prev => prev.filter(id => id !== user.id));
    fetch(`http://localhost:5153/Poruka/OznaciKaoProcitano/${korisnik_Id}/${user.id}`, { method: 'PUT' });
  };

  // const handleSendMessage = async () => {
  //   if (!newMessage.trim() || !selectedUser || !connection) return;
  //   setMessages(prev => ({
  //     ...prev,
  //     [selectedUser.id]: [...(prev[selectedUser.id] || []), { text: newMessage, sender: "me" }]
  //   }));
  //   await connection.invoke("SendMessage", korisnik_Id, selectedUser.id, newMessage);
  //   setNewMessage("");
  // };

    const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedUser || !connection) return;

    //console.log(`Šaljem poruku korisniku ${selectedUser.id} od korisnika ${korisnik.id}`);
    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [...prev[selectedUser.id], { sadrzaj: newMessage, sender: "me", vreme: new Date().toLocaleString() }],
    }));

    await connection.invoke("SendMessage", korisnik.id, selectedUser.id, newMessage);
    const response = await fetch(`http://localhost:5153/Poruka/PosaljiPoruku/${selectedUser.id}/${korisnik_Id}/${newMessage}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ poruka: newMessage })
    });
    //console.log(response);
    setNewMessage("");
  };

  const sortedUsers = [
    ...messageSenders.map(id => users.find(user => user.id === id)).filter(Boolean),
    ...users.filter(user => !messageSenders.includes(user.id))
  ];

 
  
  const handleMessClick = (index) => {
    setTimeVisibility(prev => ({
      ...prev,
      [index]: !prev[index] // Prebacuje vidljivost za poruku na tom indeksu
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'Z');
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return date.toLocaleString('sr-RS', options).replace(',', '');
  };
 

  return (
    <div>
      <button onClick={() => navigate(-1)} className="back-btn-chat"><i className="la la-arrow-left ikonicaback"></i></button>
      <div className="chat-container">
        <div className="chat-sidebar">
          <h2>Inbox</h2>
          {sortedUsers.map(user => (
            <div key={user.id} className={`chat-user ${selectedUser?.id === user.id ? "active" : ""}`}
              onClick={() => handleUserClick(user)}>
              <span style={{ fontWeight: messageSenders.includes(user.id) ? 'bold' : 'normal' }}>
                {user.ime} {messageSenders.includes(user.id) ? "[NOVA PORUKA]" : ""}
              </span>
            </div>
          ))}
        </div>
        <div className="chat-main">
          {selectedUser ? (
            <>
              <div className="chat-header">{selectedUser.ime}</div>
              <div className="chat-messages">
                {messages[selectedUser.id]?.map((msg, index) => (
                  <>
                  <div key={index} onClick={() => handleMessClick(index)} className={`message ${(msg.posiljaocId === korisnik.id || msg.sender === "me") ? "my-message" : "their-message"}`}>{msg.sadrzaj}</div>
                    <span  className="message-time">
                    {timeVisibility[index] ? formatDate(msg.vreme) : ""}
                  </span>
                  </>
                    
                    
                  
                  
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input">
                <input type="text" placeholder="Napiši poruku..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onClick={() => handleUserClick(selectedUser)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} />
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


