import React, { useState } from 'react'
import Header from '../components/Header'
import Main from '../components/Main'
import Footer from '../components/Footer'
import EventForm from '../components/EventForm'

function HomePage() {
  // [Faza 1] Dugme "Napravi dogadjaj" je u <Main/>, forma u <EventForm/> -
  // pre je jQuery spajao ta dva preko globalnog selektora. Sad je deljeno React state.
  const [formaOtvorena, setFormaOtvorena] = useState(false)
  // Novokreiran dogadjaj se ovde "presece" i prosledi nadole do EventFeed.jsx,
  // koji ga zalepi na vrh liste - bez window.location.reload().
  const [noviDogadjaj, setNoviDogadjaj] = useState(null)

  return (
    <div className={`wrapper ${formaOtvorena ? 'overlay' : ''}`}>
      <Header />
      <Main onCreateEvent={() => setFormaOtvorena(true)} noviDogadjaj={noviDogadjaj} />
      <EventForm
        otvorena={formaOtvorena}
        onClose={() => setFormaOtvorena(false)}
        onSaved={setNoviDogadjaj}
      />
      <Footer />
    </div>
  )
}

export default HomePage
