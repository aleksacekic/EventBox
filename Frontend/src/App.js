import './App.css';
import HomePage from './Pages/HomePage';
import LoginRegistracija from './Pages/LoginRegistracija';
import Profile from './Pages/Profile';
import Admin from './Pages/Admin';
import ProfilTudji from './Pages/ProfilTudji'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DogadjajZasebno from './Pages/DogadjajZasebno';
import Chat from './Pages/Chat';
import NotifikacijaTest from './Pages/NotifikacijaTest';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="App">
        <Header></Header>
        <Routes>  
          <Route path="/profil" element={<Profile />} />
          <Route path="/pocetna" element={<HomePage />} />
          <Route path="/" element={<LoginRegistracija />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/objava/:id" element={<DogadjajZasebno />} />
          <Route path="/chat" element={<Chat />} />
          {/* <Route path="/proba" element={<Proba />} /> */}
          {/* <Route path="/profilkorisnika/:id" element={<ProfilTudji />} /> */}
          <Route path="/profilkorisnika" element={<ProfilTudji />} />
          {/* <Route path="/proba" element={<NotifikacijaTest />} /> */}
        </Routes>
        <Footer></Footer>
      </div>
    </Router>
  );
}

export default App;

