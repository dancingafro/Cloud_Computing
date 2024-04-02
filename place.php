<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DigiPen Place</title>
<style>
  .container {
    position: absolute; /* Position the container absolutely */
    left: 65px; /* Adjust the left position based on the width of the color picker container */
    top: 10px; /* Adjust top position as needed */
    display: grid;
    grid-template-columns: repeat(150, 10px); /* Adjust grid size as needed */
    grid-template-rows: repeat(90, 10px); /* Adjust grid size as needed */
    gap: 0px;
    border: 0px solid #ccc;
  }
  .pixel {
    width: 10px;
    height: 10px;
    background-color: white;
    border: 1px solid #000; /* Add a 1px solid black border */
  }
  
  .colorPickerContainer {
    position: fixed;
    top: 10px; /* Adjust top position as needed */
    left: 10px; /* Adjust left position as needed */
  }
</style>
</head>
<body>
<div class="container" id="container"></div>
<div class="colorPickerContainer">
    
    <div id="timer">00:00</div>
    <input type="color" id="colorPicker" value="#ffffff">
    <button id="goToAnotherPageButton">Go to Another Page</button> <!-- Button added -->
</div>

<script>
  const container = document.getElementById('container');
  const pixels = [];
  const colorPicker = document.getElementById('colorPicker');   
  const savedColor = getCookie('selectedColor');
  let seconds = 0;
  let timerInterval;
  if (savedColor) {
    colorPicker.value = savedColor;
  }
  // Function to generate random color
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
    function randomColor(pixel)
    {
    const color = getRandomColor();
    pixel.style.backgroundColor = color;
    }
    
  // Start the timer
    setInterval(() => {
    for (let i = 0; i < 150; i++) {
    for (let j = 0; j < 90; j++) {
        //todo: get server data
        // randomColor(pixels[i][j]);
    }
  }
  }, 10); // Update every 5 seconds

  // Save selected color to cookie when it changes
  colorPicker.addEventListener('change', () => {
    setCookie('selectedColor', colorPicker.value, 30); // Cookie expires in 30 days
  });

  // Initialize grid
  for (let i = 0; i < 150; i++) {
    pixels[i] = [];
    for (let j = 0; j < 90; j++) {
      const pixel = document.createElement('div');
      pixel.classList.add('pixel');
      pixel.dataset.i = i; // Set row index as a data attribute
      pixel.dataset.j = j; // Set column index as a data attribute
      pixel.addEventListener('click', () => {
       // if(seconds != 0) return;
        seconds = 60
        timerInterval = setInterval(updateTimer, 1000);
        changeColor(pixel);
      });
      container.appendChild(pixel);
      pixels[i][j] = pixel;
    }
  }

  // Function to change color of pixel
  function changeColor(pixel) {
    const i = pixel.dataset.i; // Set row index as a data attribute
    const j = pixel.dataset.j; // Set column index as a data attribute
    const color = colorPicker.value;
    pixel.style.backgroundColor = color;
  }

  function updateTimer() {
    if (seconds === 0) {
      clearInterval(timerInterval);
      return;
    }
    --seconds;
    document.getElementById('timer').innerText = formatTime(Math.floor(seconds/60)) + ":" + formatTime(Math.floor(seconds%60));
  }

  function formatTime(time) {
    return time < 10 ? "0" + time : time;
  }

  // Function to set a cookie
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  // Function to get a cookie
  function getCookie(name) {
    const cookieName = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) == ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(cookieName) == 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
    return null;
  }
</script>
</body>
</html>