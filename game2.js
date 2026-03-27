const GAME_TIME = 200;

const fallbackWords = [
  "COLD", "CORD", "WORD", "WORM", "FORM",
  "CARD", "HARD", "HAND", "BAND", "BOND",
  "FISH", "DISH", "DASH", "CASH", "BASH",
  "BOOK", "LOOK", "LOCK", "LACK", "BACK",
  "LAMP", "LIMP", "LIME", "TIME", "TILE",
  "MIND", "WIND", "WINE", "LINE", "LONE",
  "WALL", "WELL", "BELL", "BELT", "BENT",
  "MILK", "SILK", "SICK", "SOCK", "LOCK",
  "RING", "SING", "SANG", "SAND", "HAND",
  "FIRE", "FIRM", "FORM", "FROM",
  "TREE", "FREE", "FLEE", "FLEW",
  "SHIP", "SHOP", "STOP", "STEP",
  "ROAD", "ROAM", "FOAM", "FORM",
  "MOON", "MOOD", "GOOD", "WOOD",
  "PLAN", "PLAY", "CLAY", "SLAY",
  "GAME", "FAME", "FATE", "DATE"
];

let dictionary = [];
let currentWord = "";
let score = 0;
let timeLeft = GAME_TIME;
let timerInterval = null;
let usedWords = new Set();
let gameEnded = false;

function getDictionaryArray() {
  if (Array.isArray(window.dictionaryWords)) {
    return window.dictionaryWords;
  }
  return [];
}

function getDailySeed() {
  const today = new Date();
  return Math.floor(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ) / 86400000);
}

function loadDictionary() {
  const rawDict = getDictionaryArray();

  dictionary = rawDict
    .filter(word => typeof word === "string")
    .map(word => word.trim().toUpperCase())
    .filter(word => /^[A-Z]{4}$/.test(word));

  if (dictionary.length === 0) {
    dictionary = [...fallbackWords];
  }
}

function pickDailyStartWord() {
  const seed = getDailySeed();
  return dictionary[seed % dictionary.length];
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
    showMessage("Enter a valid 4-letter word.");
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
      document.getElementById("finalScore").textContent = `Time's up! Score: ${score}`;
    }
  }, 1000);
}

function startGame2() {
  currentWord = "TEST";
  score = 0;
  timeLeft = GAME_TIME;
  usedWords = new Set([currentWord]);
  gameEnded = false;

  updateDisplay();
  showMessage("Change one letter.");
  startTimer();
}

document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("playNowBtn");
  const homeScreen = document.getElementById("home-screen");
  const gameScreen = document.getElementById("game");

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      homeScreen.style.display = "none";
      gameScreen.style.display = "block";
      startGame2();
    });
  }

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