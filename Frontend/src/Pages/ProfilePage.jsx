import React from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import Profile from '../components/Profile'
import Footer from '../components/Footer'

// Ista stranica za "/profil" (sopstveni) i "/profilkorisnika/:id" (tudji) -
// <Profile/> sam zakljuci ciji profil gleda.
function ProfilePage() {
  const { id } = useParams() // undefined na /profil

  return (
    <div className="wrapper">
      <Header />
      {/* key -> pun remount kad se promeni koji profil gledamo, cisto resetuje stanje */}
      <Profile key={id ?? 'self'} />
      <Footer />
    </div>
  )
}

export default ProfilePage
