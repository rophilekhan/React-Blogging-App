import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Dashboard from './Dashboard'

const App = () => {
  const handleNewPost = () => {
    // Update the state here
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard onNewPost={handleNewPost} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App