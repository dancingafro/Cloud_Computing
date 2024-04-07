// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgHHdYEEYzzMSSCefjQbYj9bXY4Oe5rMc",
  authDomain: "digipenplaceproject.firebaseapp.com",
  projectId: "digipenplaceproject",
  storageBucket: "digipenplaceproject.appspot.com",
  messagingSenderId: "154577461498",
  appId: "1:154577461498:web:478816edc4d42b4e2e2943"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.signInWithGoogle = function() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            window.location.href = 'index.html'; // Redirect on successful login
        })
};

window.signUpWithEmailPassword = function() {
    const email = document.getElementById('uname').value;
    const password = document.getElementById('psw').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up
            window.location.href = 'index.html'; // Redirect or update UI
        })
        .catch((error) => {
            alert(error.message); // Display error message
        });
};

// Event listener for email/password form submission
document.getElementById('emailPasswordForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('uname').value;
    const password = document.getElementById('psw').value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            window.location.href = 'index.html'; // Redirect on successful login
        })
        .catch((error) => {
            alert(error.message); // Display error messages
        });
});
