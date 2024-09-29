import React, { useRef } from 'react'
import { signUpUser } from '../config/firebase/firebasemethod'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../Navbar'
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAmsvADYYLV4xZSpcNVJ9VJzZdB9L6YMOc",
    authDomain: "react-blogging-a.firebaseapp.com",
    projectId: "react-blogging-a",
    storageBucket: "react-blogging-a.appspot.com",
    messagingSenderId: "1093549960524",
    appId: "1:1093549960524:web:85539467845b7cbcbcb3e9",
    measurementId: "G-JFHLP9RQ1H"
  };
  

firebase.initializeApp(firebaseConfig);

const Register = () => {
  let fullName = useRef()
  let email = useRef()
  let password = useRef()
  let myFile = useRef()

  let navigate = useNavigate()

  const uploadImage = async (file, email) => {
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`user-profiles/${email}/${file.name}`);
    const uploadTask = fileRef.put(file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Handle upload progress
      },
      (error) => {
        // Handle upload error
        console.error(error);
      },
      () => {
        // Handle successful upload
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          return downloadURL;
        });
      }
    );
  };

  let registerUser = async (event) => {
    event.preventDefault()

    let userProfileUrl = await uploadImage(myFile.current.files[0], email.current.value)
    console.log(userProfileUrl);

    let registerUserData = await signUpUser({
      fullname: fullName.current.value,
      email: email.current.value,
      password: password.current.value,
      userProfile: userProfileUrl
    })
    console.log('user register successfully', registerUserData);
    navigate('/login')
  }
  return (
    <div>
        <Navbar login="Login"/>
      <section className="container mx-auto p-4">
        <div className="login-section max-w-md mx-auto
         mt-[180px] lg:mt-[100px] 
         first:md:mt-[70px] bg-white shadow-lg p-6 rounded-lg">
          <form onSubmit={registerUser} className="flex flex-col gap-4">
            <input
              ref={fullName}
              className="border border-gray-300
               p-2 rounded-lg focus:outline-none
                focus:ring-2 focus:ring-green-500"
              type="text" placeholder="Full Name" required />
            <input
              ref={email} type="email" placeholder="Email"
              className="border border-gray-300 p-2
               rounded-lg focus:outline-none
                focus:ring-2 focus:ring-blue-500"
            />
            <input
              ref={password} type="password"
              placeholder="Password" required
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="file"
              ref={myFile}
              placeholder="file"
              required
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div id="loadingDiv" className="mt-4">
              <div className="text-center">
                <button id="registorBtn"
                  className="bg-blue-500 text-white
                   py-2 px-4 rounded-lg hover:bg-blue-600"> Register </button>
                <br />
              </div>
            </div>
            <Link to='/login' className="text-center text-blue -500 hover:underline mt-4">
              ALREADY A USER? PLEASE LOGIN
            </Link>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Register