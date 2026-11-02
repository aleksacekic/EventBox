import React from 'react'
import EventDetails from '../components/EventDetails'
import Header from '../components/Header'
import Footer from '../components/Footer'

function EventPage() {
  return (
    <div className="wrapper">
        <Header />
       <EventDetails />
       <Footer />
    </div>
  )
}

export default EventPage