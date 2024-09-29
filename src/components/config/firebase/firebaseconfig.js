// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmsvADYYLV4xZSpcNVJ9VJzZdB9L6YMOc",
  authDomain: "react-blogging-a.firebaseapp.com",
  projectId: "react-blogging-a",
  storageBucket: "react-blogging-a.appspot.com",
  messagingSenderId: "1093549960524",
  appId: "1:1093549960524:web:85539467845b7cbcbcb3e9",
  measurementId: "G-JFHLP9RQ1H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export default app
