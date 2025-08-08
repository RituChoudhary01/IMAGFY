import React from 'react'
import Header from '../compontents/Header'
import Steps from '../compontents/Steps'
import Description from '../compontents/Description'
import Testimonials from '../compontents/Testimonials'
import GenerateBtn from '../compontents/GenerateBtn'

function Home() {
  return (
    <div>
      <Header/>
      <Steps/>
      <Description/>
      <Testimonials/>
      <GenerateBtn/>
    </div>
  )
}

export default Home