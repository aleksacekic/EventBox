import React from 'react'
import Header from '../components/Header'
import Main from '../components/Main'
import Footer from '../components/Footer'
import NapraviDogadjaj from '../components/NapraviDogadjaj'

function HomePage() {
  return (
    <div className="wrapper">   
      <Main />
      <NapraviDogadjaj />
    </div>
  )
}

export default HomePage