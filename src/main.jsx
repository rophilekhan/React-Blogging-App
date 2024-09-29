import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Home from './pages/Home.jsx'
import Dashbord from './pages/Dashbord.jsx'
import ProtectedRout from './'
import Profile from './components/pages/Profile.jsx'

const router = createBrowserRouter([
  {
    path: '',
    element: <Layout />,
    children : [
      {
        path : '/',
        element: <Home />
      },
      {
        path: 'login',
        element: <Login/>
      },
      {
        path: 'register',
        element: <Register/>
      },
      {
        path : 'dashbord',
        element :<ProtectedRout component={<Dashbord/>}/>
      },
      {
        path : 'profile',
        element :<ProtectedRout component={<Profile/>}/>
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router}>
    <Layout />
  </RouterProvider>
)
