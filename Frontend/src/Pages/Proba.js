import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import Cookies from 'js-cookie'

const Proba = () => {
  const [connection, setConnection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dogadjaj, setDogadjaj] = useState({});
  //
  const id = 26;

    useEffect(() => {
      async function fetchDogadjaj(id) {
          try {
              const response = await fetch(`http://localhost:5153/Dogadjaj/VratiDogadjaj/${id}`);
              if (!response.ok) {
                  throw new Error(`Greška pri dohvaćanju događaja: ${response.statusText}`);
              }
              const data = await response.json();
              setDogadjaj(data);
          } catch (error) {
              console.error('Greška pri dohvaćanju podataka o događaju:', error);
          }
      }

      fetchDogadjaj(id); 
  }, []);

  
  useEffect(() => {
    
    const connect = new HubConnectionBuilder()
    .withUrl("http://localhost:5153/notificationHub?userId=" + encodeURIComponent(8))
    .build();

connect.start()
    .then(() => console.log("Connected to SignalR hub"))
    .catch(err => console.error("Connection failed: ", err));


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
