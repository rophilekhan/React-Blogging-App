import React, { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, sendData, getData, getAllData } from '../config/firebase/firebasemethod'
import { useNavigate } from 'react-router-dom'
import Navbar from '../Navbar'
import { Button, Typography } from '@mui/material'
import BlogsPost from '../BlogPost'

const Dashbord = () => {
  let navigate = useNavigate()
  const [userUid, setuserUid] = useState(null)
  let titleRef = useRef()
  let articleRef = useRef()

  const [blogs, setBlogs] = useState([])
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(user.uid)
        setuserUid(user.uid)
        const blogsData = await getData("blogs", user.uid)
        console.log(blogsData)
        setBlogs([...blogsData])
      }
    })
  }, [])

  useEffect(() => {
    async function getUserFromDataBase() {
      let getUserData = await getAllData("blogs")
      console.log(getUserData);
    }
    getUserFromDataBase()
  }, [])

  const sendDataFromFireStore = async (event) => {
    event.preventDefault()
    if (titleRef.current.value === '' || articleRef.current.value === '') {
      alert('Checked Again')
    } else {
      console.log(titleRef.current.value);
      console.log(articleRef.current.value);
      blogs.push({
        title: titleRef.current.value.toUpperCase(),
        article: articleRef.current.value.toUpperCase(),
        uid: auth.currentUser.uid
      })
      setBlogs([...blogs])
      const sendBlogs = await sendData({
        title: titleRef.current.value.toUpperCase(),
        article: articleRef.current.value.toUpperCase(),
        uid: auth.currentUser.uid
      }, "blogs")

      console.log(sendBlogs);
      titleRef.current.value = ''
      articleRef.current.value = ''
    }
  }

  return (
    <div>
      <Navbar profile="profile" dashbord="Dashbord" />
      <div className='p-3 container mx-auto'>
        <Typography variant='h3' fontWeight='bold' className='p-2'>Write Blog</Typography>
        <hr />
        <div className='mt-10'>
          <form className='flex flex-col gap-2'>
            <input ref={titleRef} className='border rounded pl-2 outline-none border-gray-200 w-[100%] h-[46px]' type="text" placeholder='Enter Title' />
            <textarea ref={articleRef} className='p-2 w-[100%] shadow-[] rounded border-gray-200 border outline-none' cols='165' rows='6' name="" id="" placeholder='Enter articlee'>
            </textarea>
            <Button onClick={sendDataFromFireStore} variant='contained'>Publish Post</Button>
          </form>
        </div>
        <div className='mt-4'>
          <Typography variant='h4' className='mt-4'>
            Your Article Here.
          </Typography>
          <div className='mt-4 flex flex-col gap-3'>
            {blogs.length > 0 ? blogs.map((item, index) => (
              <BlogsPost key={index} blog={item} />
            )) : <p>No Blogs Found...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashbord