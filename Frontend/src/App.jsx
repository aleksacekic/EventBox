import "./App.css";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import ProfilePage from "./Pages/ProfilePage";
import AdminPage from "./Pages/AdminPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EventPage from "./Pages/EventPage";
import ChatPage from "./Pages/ChatPage";
import { AuthProvider, RequireAuth } from "./auth";
import { NotificationsProvider } from "./notifications";
import { GoogleMapsProvider } from "./maps";
import InfoPage from "./Pages/InfoPage";
import { INFO_STRANICE } from "./infoStranice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
      <GoogleMapsProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* Javna ruta */}
            <Route path="/" element={<LoginPage />} />

            {/* Zasticene rute - bez tokena redirect na "/" pre montiranja */}
            <Route path="/pocetna" element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/profil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/profilkorisnika/:id" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
            <Route path="/objava/:id" element={<RequireAuth><EventPage /></RequireAuth>} />
            <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
            {INFO_STRANICE.map((s) => (
              <Route key={s.slug} path={s.putanja} element={<RequireAuth svi><InfoPage slug={s.slug} /></RequireAuth>} />
            ))}
          </Routes>
          {/* Kratke poruke (toast.success/error/...) umesto alert(), koji blokira stranicu */}
          <ToastContainer position="top-center" autoClose={4000} newestOnTop closeOnClick pauseOnFocusLoss={false} />
        </div>
      </Router>
      </GoogleMapsProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
