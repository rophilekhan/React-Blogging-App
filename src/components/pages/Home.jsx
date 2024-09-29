import React, { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, getAllData } from '../config/firebase/firebasemethod'
import { Typography } from '@mui/material'
import Navbar from '../Navbar'
import BlogsPost from '../BlogPost'

const Home = () => {
  const [allBlogs, setallBlogs] = useState([])

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('user logged In')
        let getAllDataFromDb = await getAllData("blogs")
        setallBlogs(getAllDataFromDb)
        console.log(getAllDataFromDb);
      } else {
        console.log('user logout sucessfully');
      }
    })
  }, [])

  return (
    <>
      <Navbar login="login" userName='Rophile Ahmed Khan' />
      <section className='container mx-auto p-1'>
        <Typography variant='h3' fontWeight='bold' className='p-2'>All Blogs</Typography>
        <hr />

        {allBlogs.length > 0 ? (
          <div>
            {allBlogs.map((blog) => (
              <BlogsPost key={blog.documentId} blog={blog} />
            ))}
          </div>
        ) : (
          <p>No Blogs Found...</p>
        )}
      </section>
    </>
  )
}

export default Home