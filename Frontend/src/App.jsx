import "./App.css";
import HomePage from "./Pages/HomePage";
import LoginRegistracija from "./Pages/LoginRegistracija";
import Profile from "./Pages/Profile";
import Admin from "./Pages/Admin";
import ProfilTudji from "./Pages/ProfilTudji";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DogadjajZasebno from "./Pages/DogadjajZasebno";
import Chat from "./Pages/Chat";
import { AuthProvider, RequireAuth } from "./auth";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Javna ruta */}
            <Route path="/" element={<LoginRegistracija />} />

            {/* Zasticene rute - bez tokena redirect na "/" pre montiranja */}
            <Route path="/pocetna" element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/profil" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
            <Route path="/objava/:id" element={<RequireAuth><DogadjajZasebno /></RequireAuth>} />
            <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="/profilkorisnika/:id" element={<RequireAuth><ProfilTudji /></RequireAuth>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
