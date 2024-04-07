// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

window.signInWithGoogle = function() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => { 
      window.location.href = 'index.html'; // Redirect on successful login
    });
};

window.signUpWithEmailPassword = function() {
  var email = document.getElementById('uname').value;
  var password = document.getElementById('psw').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up
      var user = userCredential.user;
      // You can redirect the user to another page or update the UI accordingly
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      // Display error message
      alert(errorMessage);
    });
};

const auth = getAuth(app);

      // Sign in with Email and Password
      const form = document.getElementById('emailPasswordForm');
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('uname').value;
        const password = document.getElementById('psw').value;
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            // Signed in
            window.location.href = 'index.html'; // Redirect on successful login
          })
          .catch((error) => {
            alert(error.message); // Display error messages
          });
      });

      // Sign in with Google
function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
          .then((result) => { 
            window.location.href = 'index.html'; // Redirect on successful login
          });
}

function signUpWithEmailPassword() {
  var email = document.getElementById('uname').value;
  var password = document.getElementById('psw').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up
      var user = userCredential.user;
      // You can redirect the user to another page or update the UI accordingly
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
// Display error message
      alert(errorMessage);
    });
}
