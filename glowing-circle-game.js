const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const startButton = document.getElementById('startButton');
const rules = document.getElementById('rules');
let gameStarted = false; // Set the initial value to false
const circleAcceleration = { x: 0, y: 0 };

function updateAcceleration(event) {
  circleAcceleration.x = event.accelerationIncludingGravity.x;
  circleAcceleration.y = event.accelerationIncludingGravity.y;
}

if (window.DeviceOrientationEvent) {
  window.addEventListener('deviceorientation', updateAcceleration);
}

function updateCircle() {
  circleX += circleAcceleration.x;
  circleY += circleAcceleration.y;

  // Clamp circle position within the canvas bounds
  circleX = Math.max(circleRadius, Math.min(canvas.width - circleRadius, circleX));
  circleY = Math.max(circleRadius, Math.min(canvas.height - circleRadius, circleY));
}


startButton.addEventListener('click', () => {
  startGame();
});

function startGame() {
  console.log('Starting the game...'); // Add this line to check if the function is being called
  gameStarted = true;
  rules.classList.add('hidden');
  
  // Hide the title element
  const gameTitle = document.getElementById('gameTitle');
  gameTitle.classList.add('hidden');
  
  spawnObjects();
  gameLoop();

  // Resume the AudioContext after a user gesture
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed successfully');
    }).catch((error) => {
      console.error('Error resuming AudioContext:', error);
    });
  }
}

  
function playNote(frequency, duration) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(-10, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}


function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  circleX = canvas.width / 2;
  circleY = canvas.height / 2;
  console.log(`Canvas size: ${canvas.width} x ${canvas.height}`);
}


window.addEventListener('resize', resizeCanvas);
resizeCanvas();
;

const circleRadius = 50;
const innerRadius = circleRadius - 2;
let spawnInterval = 500;
let starLifetime = 2000;
let spawnDistance = 100; 
let maxScoreReached = 0;

let stars = [];
let score = 1;
let gameOver = false;
let lastGameScore = 0;


function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameStarted && !gameOver) {
    drawCircle();
    drawStars();

    collectStars();
    removeExpiredStars();

    if (score <= 0) {
      gameOver = true;
      showGameOverScreen(); // Call the game over screen function when the game is over
    }

    drawScore();
  } else if (gameOver) {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}


function drawCircle() {
  // Draw the outer circle with glowing effect
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.shadowBlur = 15; // Set the blur size
  ctx.shadowColor = 'white'; // Set the blur color
  ctx.fill();
  ctx.closePath();

  // Reset shadow properties before drawing the inner circle
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // Draw the inner circle
  ctx.beginPath();
  ctx.arc(circleX, circleY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.closePath();
}

function drawGlow(star) {
  const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 8);
  gradient.addColorStop(0, 'rgba(255, 255, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.closePath();
}

function drawStars() {
  stars.forEach((star) => {
    // Draw the outer circle with a radial gradient fill style to create a glow effect
    const gradient = ctx.createRadialGradient(star.x, star.y, star.radius / 2, star.x, star.y, star.radius);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius * 8, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
    
    // Draw the inner circle of the star
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.globalAlpha = star.twinkleIndex % Math.floor(Math.random() * 40 + 10) == 0 ? Math.random() * 0.5 + 0.5 : 1.0;
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1.0;

    // Update the twinkleIndex for the star
    star.twinkleIndex++;
  });
}





function drawScore() {
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Score: ' + score, 100, 30);
}

function updateRing(event) {
  circleX = event.clientX - canvas.getBoundingClientRect().left;
  circleY = event.clientY - canvas.getBoundingClientRect().top;
}

const cMajorScale = [261.63, 261.63, 392.00, 392.00, 440.00, 440.00, 392.00, 349.23, 349.23, 329.63, 329.63, 293.66, 293.66, 261.63];

let currentNoteIndex = 0;

function collectStars() {
  stars.forEach((star, index) => {
    const starDx = star.x - circleX;
    const starDy = star.y - circleY;
    const distanceSquared = starDx * starDx + starDy * starDy;

    if (distanceSquared <= innerRadius * innerRadius) {
      stars.splice(index, 1);
      score++;
      spawnInterval *= 0.99;

      // Play the next note in the melody
      const frequency = cMajorScale[currentNoteIndex];
      playNote(frequency, 0.5);
      currentNoteIndex++;

      // Reset the note index when we reach the end of the melody
      if (currentNoteIndex >= cMajorScale.length) {
        currentNoteIndex = 0;
      }
    }
  });

  maxScoreReached = Math.max(score, maxScoreReached);
}




function spawnObjects() {
  // Random angle between 0 and 2 * PI
  const angle = Math.random() * Math.PI * 2;

  // Calculate the position on the ring with some random deviation
  const spawnX = circleX + spawnDistance * Math.cos(angle) + Math.random() * 10 - 5;
  const spawnY = circleY + spawnDistance * Math.sin(angle) + Math.random() * 10 - 5;

  // Create a star with a random size and a twinkleIndex of 0
  stars.push({ x: spawnX, y: spawnY, radius: Math.random() * 2 + 2, timeCreated: Date.now(), twinkleIndex: 0 });

  // Schedule the next spawn
  setTimeout(spawnObjects, spawnInterval);
}


function removeExpiredStars() {
  const currentTime = Date.now();
  let newStars = [];
  stars.forEach(star => {
    if (currentTime - star.timeCreated < starLifetime) {
      newStars.push(star);
      star.scoreDeducted = false; // Reset scoreDeducted if the star has not yet expired
    } else if (!star.scoreDeducted) {
      star.scoreDeducted = true;
      score--; // Decrease score only once if the star has expired
      newStars.push(star); // Keep the star in the array until the score is deducted
    }
  });
  stars = newStars.filter(star => !star.scoreDeducted || currentTime - star.timeCreated < starLifetime + 50);
}



let highestScore = localStorage.getItem('highestScore') ? parseInt(localStorage.getItem('highestScore')) : 1;

function updateHighestScore() {
  if (gameOver) {
    lastGameScore = maxScoreReached;
    const storedHighestScore = localStorage.getItem('highestScore');
    const currentHighestScore = Math.max(maxScoreReached, storedHighestScore || 0);
    localStorage.setItem('highestScore', currentHighestScore);
    highestScore = currentHighestScore;
  }
}

function drawGameOver() {
  updateHighestScore();

  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('You lost!', canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = '20px Arial';
  ctx.fillText('Last Game Score: ' + lastGameScore, canvas.width / 2, canvas.height / 2); // Display the last game's score
  ctx.fillText('Highest Score: ' + highestScore, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText('Click to start again', canvas.width / 2, canvas.height / 2 + 60);

  drawScore();
}

function restartGame() {
 spawnInterval = 500;
 starLifetime = 2000;
 spawnDistance = 100; 
  gameOver = false;
  gameStarted = true; // Add this line to set gameStarted to true when restarting the game
  score = 1; // Reset score before clearing the stars array
  stars = [];

  spawnObjects();
  updateHighestScore(); // Add this line to update the highest score
}




    
function showGameOverScreen() {
  gameStarted = false;
  gameOver = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGameOver();
}

canvas.addEventListener('click', (event) => {
  if (!gameStarted && !gameOver) {
    startGame();
  } else if (gameOver) {
    restartGame();
  }
});


canvas.addEventListener('mousemove', updateRing);


