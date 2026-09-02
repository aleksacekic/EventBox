import React from 'react'
import ProfilTudjiKomponenta from '../components/ProfilTudjiKomponenta'
import Header from '../components/Header'
import Footer from '../components/Footer'

function ProfilTudji() {
  return (
    <div className="wrapper">
      <Header />
      <ProfilTudjiKomponenta />
      <Footer />
    </div>
  )
}

export default ProfilTudji