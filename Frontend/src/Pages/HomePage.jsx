import React, { useState } from 'react'
import Header from '../components/Header'
import Main from '../components/Main'
import Footer from '../components/Footer'
import NapraviDogadjaj from '../components/NapraviDogadjaj'

function HomePage() {
  // [Faza 1] Dugme "Napravi dogadjaj" je u <Main/>, forma u <NapraviDogadjaj/> -
  // pre je jQuery spajao ta dva preko globalnog selektora. Sad je deljeno React state.
  const [formaOtvorena, setFormaOtvorena] = useState(false)

  return (
    <div className={`wrapper ${formaOtvorena ? 'overlay' : ''}`}>
      <Header />
      <Main onNapraviDogadjaj={() => setFormaOtvorena(true)} />
      <NapraviDogadjaj otvorena={formaOtvorena} onZatvori={() => setFormaOtvorena(false)} />
      <Footer />
    </div>
  )
}

export default HomePage
