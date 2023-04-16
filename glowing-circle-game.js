const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const blip = document.getElementById('blip');

const circleRadius = 50;
let circleX = canvas.width / 2;
let circleY = canvas.height / 2;
const innerRadius = circleRadius - 2;
let spawnInterval = 1000;

let stars = [];
let score = 0;
let gameStarted = false;

function drawCircle() {
  // Draw the outer circle
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.closePath();

  // Draw the inner circle
  ctx.beginPath();
  ctx.arc(circleX, circleY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.closePath();
}

function drawStars() {
  ctx.fillStyle = 'yellow';
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
}

function drawScore() {
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Score: ' + score, 10, 30);
}

function updateRing(event) {
  circleX = event.clientX - canvas.getBoundingClientRect().left;
  circleY = event.clientY - canvas.getBoundingClientRect().top;
}

function collectStars() {
  stars.forEach((star, index) => {
    const starDx = star.x - circleX;
    const starDy = star.y - circleY;
    const distanceSquared = starDx * starDx + starDy * starDy;

    if (distanceSquared <= innerRadius * innerRadius) {
      stars.splice(index, 1); // Remove star from the array
      score++;
      spawnInterval *= 0.99; // Make stars appear faster
      blip.currentTime = 0; // Reset audio playback
      blip.play(); // Play the blip sound
    }
  });
}

function spawnObjects() {
  // Random angle between 0 and 2 * PI
  const angle = Math.random() * Math.PI * 2;

  // Calculate the position on the ring
  const spawnX = circleX + (circleRadius + 10) * Math.cos(angle);
  const spawnY = circleY + (circleRadius + 10) * Math.sin(angle);

  stars.push({ x: spawnX, y: spawnY, radius: 3 });

  // Schedule the next spawn
  setTimeout(spawnObjects, spawnInterval);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCircle();
  drawStars();
  drawScore();

  collectStars();

  if (gameStarted) {
    requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  if (!gameStarted) {
    gameStarted = true;
    canvas.removeEventListener('click', startGame);
    canvas.addEventListener('mousemove', updateRing);
    spawnObjects();
    gameLoop();
  }
}

canvas.addEventListener('click', startGame);