import React from 'react'
import Navbar from '../Navbar'
import { Typography } from '@mui/material'
const Profile = () => {
  return (
    <>
      <Navbar />
      <section className="text-gray-600 body-font container mx-auto p-2">
        <Typography variant='h3' fontWeight='bold' className='p-2 text-black'>Your Profile</Typography>
        <hr />
        <div
          className="container mx-auto flex px-5 py-14 items-center justify-center flex-col"
          bis_skin_checked={1}
        >
          <img
            // className="lg:w-1/6 md:w-3/6 w-5/6 mb-10 object-cover object-center rounded" 
            src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpK6DibZ8rjt974_abGKBQgsHJos2hJkxU_g&s'
          />
          <div className="text-center lg:w-2/3 w-full"
           bis_skin_checked={1}>
            <h1 className="title-font 
            sm:text-4xl text-3xl mb-4 
            font-medium text-gray-900">
              Rophile Ahmed Khan
            </h1>
            <p className="mb-8 leading-relaxed">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam, odio odit
               dolorum corrupti ipsum autem aperiam maxime voluptates totam, 
               cupiditate incidunt ea ipsa officiis iure, praesentium cum similique 
               distinctio in expedita blanditiis dolore. At vel nam placeat temporibus?
                Nostrum, neque quos! Itaque eius, quibusdam, amet ex et enim excepturi vero eveniet
                 reprehenderit illo natus porro. Omnis eaque doloremque beatae ipsum velit quam
                  veritatis nisi delectus adipisci quidem quos recusandae sunt quia cupiditate consequatur enim
                   tempora ab corporis obcaecati repellendus labore, corrupti sit? Ipsam, beatae!
                    Asperiores quia expedita ab pariatur ipsum neque animi culpa tempora iure, nihil quaerat incidunt
                     odit tempore.
            </p>
            <div className="flex justify-center" bis_skin_checked={1}>
              <button className="inline-flex text-white bg-indigo-500
               border-0 py-2 px-6 focus:outline-none
               hover:bg-indigo-600 rounded text-lg">
                Button
              </button>
              <button className="ml-4 inline-flex text-gray-700
               bg-gray-100 border-0 py-2 px-6
                focus:outline-none hover:bg-gray-200 rounded text-lg">
                Button
              </button>
            </div>
          </div>
        </div>
        {/* Add a section for blog posts */}
        <div className="container mx-auto p-5">
          <Typography variant='h4' fontWeight='bold' className='p-2 text-black'>Recent Blog Posts</Typography>
          <ul>
            <li>
              <Typography variant='body1' className='text-gray-600'>
                <a href="#" className="text-indigo-500 hover:text-indigo-600">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                </a>
              </Typography>
              <Typography variant='body2' className='text-gray-500'>
                Posted on March 12, 2023
              </Typography>
            </li>
            <li>
              <Typography variant='body1' className='text-gray-600'>
                <a href="#" className="text-indigo-500 hover:text-indigo-600">
                  Veniam, odio odit dolorum corrupti ipsum autem aperiam maxime.
                </a>
              </Typography>
              <Typography variant='body2' className='text-gray-500'>
                Posted on February 20, 2023
              </Typography>
            </li>
            {/* Add more blog posts here */}
          </ul>
        </div>
      </section>
    </>
  )
}
export default Profile