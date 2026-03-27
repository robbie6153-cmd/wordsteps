const GAME_TIME = 200;

let currentWord = "";
let score = 0;
let timeLeft = GAME_TIME;
let timerInterval = null;
let usedWords = new Set();
let gameEnded = false;

const fallbackWords = [
  "COLD", "CARD", "HAND", "FISH", "BOOK", "WORD", "FORK", "LAMP",
  "MIND", "WALL", "MILK", "RING", "SAND", "FIRE", "WIND", "TREE",
  "BELL", "SHIP", "ROAD", "STAR", "MOON", "PLAN", "GAME", "STEP"
];

function getDailySeed() {
  const today = new Date();
  return Math.floor(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ) / 86400000);
}

function pickDailyStartWord() {
  const seed = getDailySeed();
  return fallbackWords[seed % fallbackWords.length];
}

function updateDisplay() {
  document.getElementById("currentWord").textContent = currentWord;
  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = timeLeft;
}

function showMessage(message, good = false) {
  const el = document.getElementById("message");
  el.textContent = message;
  el.style.color = good ? "green" : "red";
}

function countLetterDifferences(a, b) {
  if (a.length !== b.length) return 99;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff;
}

function submitWord() {
  if (gameEnded) return;

  const input = document.getElementById("wordInput");
  const newWord = input.value.trim().toUpperCase();

  if (!/^[A-Z]{4}$/.test(newWord)) {
  showMessage("Enter a 4-letter word.");
  return;
}

if (dictionary.length === 0) {
  showMessage("Dictionary still loading. Try again.");
  return;
}

if (!dictionary.includes(newWord)) {
  showMessage("Not in dictionary.");
  return;
}

  if (newWord === currentWord) {
    showMessage("Change one letter.");
    return;
  }

  if (usedWords.has(newWord)) {
    showMessage("Already used.");
    return;
  }

  if (countLetterDifferences(currentWord, newWord) !== 1) {
    showMessage("Only one letter can change.");
    return;
  }

  currentWord = newWord;
  usedWords.add(newWord);
}
  

  currentWord = newWord;
  usedWords.add(newWord);
  score++;

  updateDisplay();
  showMessage("Good!", true);
  input.value = "";
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameEnded = true;
      timeLeft = 0;
      updateDisplay();
      document.getElementById("finalScore").textContent = `Time's up! Score: ${score}`;
    }
  }, 1000);
}

function startGame2() {
  currentWord = pickDailyStartWord();
  score = 0;
  timeLeft = GAME_TIME;
  usedWords = new Set([currentWord]);
  gameEnded = false;

  document.getElementById("finalScore").textContent = "";
  document.getElementById("wordInput").value = "";

  updateDisplay();
  showMessage("Change one letter.");
  startTimer();
}

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const wordInput = document.getElementById("wordInput");

  if (submitBtn) {
    submitBtn.addEventListener("click", submitWord);
  }

  if (wordInput) {
    wordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitWord();
    });
  }
});