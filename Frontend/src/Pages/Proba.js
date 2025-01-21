import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

const Proba = () => {
  const [connection, setConnection] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const connect = new HubConnectionBuilder()
      .withUrl("http://localhost:5153/notificationHub")
      .build();

connect.start()
      .then(() => console.log("Connected to SignalR Hub"))
      .catch((err) => console.log("Error while connecting to SignalR Hub:", err));

      connect.on("ReceiveNewComment", (commentText, eventId) => {
        console.log("New comment received:", commentText, "Event ID:", eventId);
        setNotifications((prevNotifications) => [...prevNotifications, commentText]);
      });
      


    setConnection(connect);

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notif, index) => (
          <li key={index}>{notif}</li>
        ))}
      </ul>
    </div>
  );
};

export default Proba;
