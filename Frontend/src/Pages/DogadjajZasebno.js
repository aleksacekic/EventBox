import React from 'react'
import DogadjajPosebnaStrana from '../components/DogadjajPosebnaStrana'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

function DogadjajZasebno() {
  return (
    <div>
        <Header />
       <DogadjajPosebnaStrana />
       <Footer />
    </div>
  )
}

export default DogadjajZasebno