import { onAuthStateChanged } from 'firebase/auth'
import React, { useEffect } from 'react'
import { auth } from '../Config/firebase/FirebaseMethod'
import { useNavigate } from 'react-router-dom'

const ProtectedRout = ({ component }) => {
  const navigate = useNavigate()

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(user)
      }else {
          navigate('/login')
      }
    })
  }, [])


  return (
    <div>
      {component}
    </div>
  )
}

export default ProtectedRout
