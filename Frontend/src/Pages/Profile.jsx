import React from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import Profil from '../components/Profil'
import Footer from '../components/Footer'

// Ista stranica za "/profil" (sopstveni) i "/profilkorisnika/:id" (tudji) -
// <Profil/> sam zakljuci ciji profil gleda.
function Profile() {
  const { id } = useParams() // undefined na /profil

  return (
    <div className="wrapper">
      <Header />
      {/* key -> pun remount kad se promeni koji profil gledamo, cisto resetuje stanje */}
      <Profil key={id ?? 'self'} />
      <Footer />
    </div>
  )
}

export default Profile
