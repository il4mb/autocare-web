// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAtU-t5-tCKwK6ap0lHJs37ZaroYHeHeY8",
    authDomain: "autocare-16784.firebaseapp.com",
    projectId: "autocare-16784",
    storageBucket: "autocare-16784.firebasestorage.app",
    messagingSenderId: "1089315039468",
    appId: "1:1089315039468:web:80c8d67d0cd33d43445dc9",
    measurementId: "G-HYJEBRK0QB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);