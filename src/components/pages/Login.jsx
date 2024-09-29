import React, { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../config/firebase/firebasemethod'
import Navbar from '../Navbar'

const Login = () => {
    let email = useRef()
    let password = useRef()
    let navigate = useNavigate()

    let loginUserFunc = async (event) => {
        event.preventDefault()
        console.log(email.current.value);
        console.log(password.current.value);

        let loginUserFromDatabase = await loginUser({
            email: email.current.value,
            password: password.current.value
        })
        console.log('user login Succesfully', loginUserFromDatabase);
        navigate('/dashbord')
    }

    return (
        <>
            <Navbar register="Register"/>
            <section className="container mx-auto p-4">
                <div className="login-section mt-[200px] lg:mt-[100px]
                 first:md:mt-[100px] max-w-md mx-auto
                  bg-white shadow-lg p-6 rounded-lg">
                    <form onSubmit={loginUserFunc} className="flex flex-col gap-4">
                        <label htmlFor="email" className="text-lg font-medium">
                            Email
                        </label>
                        <input
                            type="email"
                            ref={email}
                            placeholder="Enter Your Email"
                            required
                            className="border border-gray-300 p-2
                             rounded-lg focus:outline-none focus:ring-2
                              focus:ring-blue-500"
                        />
                        <label htmlFor="password"
                         className="text-lg font-medium">
                            Password
                        </label>
                        <input
                            ref={password}
                            type="password"
                            placeholder="Enter Your Password"
                            required
                            className="border border-gray-300 p-2 
                            rounded-lg focus:outline-none focus:ring-2
                             focus:ring-blue-500"
                        />
                        <div className="mt-4">
                            <div className="text-center">
                                <button
                                    className="bg-blue-500 text-white 
                                    py-2 px-4 rounded-lg
                                     hover:bg-blue-600"
                                >
                                    Login
                                </button>
                                <br />
                            </div>
                        </div>
                        <Link to='/register' className="text-center 
                        text-blue-500 
                        hover:underline mt-4" >
                            NOT A USER? PLEASE REGISTER FIRST
                        </Link>
                    </form>
                </div>
            </section>
        </>
    )
}

export default Login