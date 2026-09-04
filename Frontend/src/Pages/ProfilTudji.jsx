import React from 'react'
import { useParams } from 'react-router-dom'
import ProfilTudjiKomponenta from '../components/ProfilTudjiKomponenta'
import Header from '../components/Header'
import Footer from '../components/Footer'

function ProfilTudji() {
  const { id } = useParams()
  return (
    <div className="wrapper">
      <Header />
      {/* key={id} -> pun remount kad se promeni profil, cisto resetuje stanje */}
      <ProfilTudjiKomponenta key={id} />
      <Footer />
    </div>
  )
}

export default ProfilTudji
