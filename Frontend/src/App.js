import './App.css';
import HomePage from './Pages/HomePage';
import LoginRegistracija from './Pages/LoginRegistracija';
import Profile from './Pages/Profile';
import Admin from './Pages/Admin';
import ProfilTudji from './Pages/ProfilTudji'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/profil" element={<Profile />} />
          <Route path="/pocetna" element={<HomePage />} />
          <Route path="/" element={<LoginRegistracija />} />
          <Route path="/admin" element={<Admin />} />
          {/* <Route path="/profilkorisnika/:id" element={<ProfilTudji />} /> */}
          <Route path="/profilkorisnika" element={<ProfilTudji />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

