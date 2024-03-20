import { FIREBASE_API_KEY } from "../env.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, Timestamp,addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js'

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "d-area-explorer-staging.firebaseapp.com",
  projectId: "d-area-explorer-staging",
  storageBucket: "d-area-explorer-staging.appspot.com",
  messagingSenderId: "862242299614",
  appId: "1:862242299614:web:815da51faf02d9373f2c4f",
  measurementId: "G-540GBW9XC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app,"metrics-db");

const shareButton = document.querySelector('.share-button');

shareButton.addEventListener('click', () => {
  const currentURL = window.location.href; 
  navigator.clipboard.writeText(currentURL)
    .then(() => console.log('URL copied to clipboard'))
    .catch((error) => console.log('Error copying URL: ', error));
    const data = {
      timestamp: Timestamp.now(),
      url: currentURL
    };
    
    const docRef = addDoc(collection(db, "metrics-urls"), data); 
    console.log("Camera settings saved with ID: ", docRef.id);
});