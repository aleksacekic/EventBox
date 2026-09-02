import React from 'react'
import Header from '../components/Header'
import Main from '../components/Main'
import Footer from '../components/Footer'
import NapraviDogadjaj from '../components/NapraviDogadjaj'

function HomePage() {
  return (
    <div className="wrapper"> 
    <Header />  
      <Main />
      <NapraviDogadjaj />
      <Footer />
    </div>
  )
}

export default HomePage