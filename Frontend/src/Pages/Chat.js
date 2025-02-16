import React, { useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';

const users = [
  { id: 1, name: "Marko Markovic" },
  { id: 2, name: "Ana Anovic" },
  { id: 3, name: "Ivan Ivanovic" },
];
//PROBNI USERI. KASNIJE CE SE DOHVATITI IZ BAZE

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");

  const handleUserClick = (user) => {
    setSelectedUser(user);
    if (!messages[user.id]) {
      setMessages((prev) => ({ ...prev, [user.id]: [] }));
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !selectedUser) return;

    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [...prev[selectedUser.id], { text: newMessage, sender: "me" }],
    }));
    setNewMessage("");
  };

  const navigate = useNavigate();
    const handleBackClick = () => {
        navigate(-1); // -1 vraća na prethodnu stranicu
    };

  return (
    <div>

    
    <div>
      <button onClick={handleBackClick} className="back-btn-chat">
              <i className="la la-arrow-left ikonicaback"></i>
            </button>
    </div>
    <div className="chat-container">

      
      {/* Leva strana - korisnici za cetovanje */}
      <div className="chat-sidebar">
        <h2>Inbox</h2>
        {users.map((user) => (
          <div
            key={user.id}
            className={`chat-user ${selectedUser?.id === user.id ? "active" : ""}`}
            onClick={() => handleUserClick(user)}
          >
            {user.name}
          </div>
        ))}
      </div>

      {/* Sredina - chat sa izabranim korisnikom */}
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">{selectedUser.name}</div>
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
