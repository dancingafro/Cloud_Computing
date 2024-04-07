// Firebase SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';

// Firebase configuration for web app
const firebaseConfig = {
  apiKey: "AIzaSyDgHHdYEEYzzMSSCefjQbYj9bXY4Oe5rMc",
  authDomain: "digipenplaceproject.firebaseapp.com",
  projectId: "digipenplaceproject",
  storageBucket: "digipenplaceproject.appspot.com",
  messagingSenderId: "154577461498",
  appId: "1:154577461498:web:478816edc4d42b4e2e2943"
};

// Initialize Firebase app with the above configuration
const app = initializeApp(firebaseConfig);

// Initialize Firebase authentication module
const auth = getAuth(app);

// Function to log user information to your server
function logUserToServer(email, loginType) {
  const data = JSON.stringify({ email, loginType });
  console.log('Logging user:', data);
  
  fetch('http://localhost:3000/log-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data,
  })
  .then(response => response.json())
  .then(data => {
    console.log('User logged:', data);
    // Store the received token in sessionStorage
    sessionStorage.setItem('userToken', data.token);
    // Redirect on successful login
    window.location.href = 'index.html';
  })
  .catch((error) => console.error('Error:', error));
}

// Function to handle Google sign-in
window.signInWithGoogle = function() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      const email = result.user.email;
      // Log user with Google login type
      logUserToServer(email, 'Google');
    });
};

// Function to handle sign up with email and password
window.signUpWithEmailPassword = function() {
  const email = document.getElementById('uname').value;
  const password = document.getElementById('psw').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Log user with Email login type
      logUserToServer(email, 'Email');
    })
    .catch((error) => {
      alert(error.message); // Display error message
    });
};

// Event listener for email and password form submission
document.getElementById('emailPasswordForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const email = document.getElementById('uname').value;
  const password = document.getElementById('psw').value;
  
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Log user with Email login type
      logUserToServer(email, 'Email');
    })
    .catch((error) => {
      alert(error.message); // Display error messages
    });
});
