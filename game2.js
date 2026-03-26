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
  "STAR", "STIR", "STIR", "STIR",
  "MOON", "MOOD", "GOOD", "WOOD",
  "PLAN", "PLAY", "CLAY", "SLAY",
  "GAME", "FAME", "FATE", "DATE",
  "STEP", "STOP", "SHOP", "SHOT"
];

let dictionary = [];
let currentWord = "";
let score = 0;
let timeLeft = GAME_TIME;
let timerInterval = null;
let usedWords = new Set();
let gameEnded = false;

// ✅ SIMPLE dictionary loader
function getDictionaryArray() {
  if (Array.isArray(window.dictionaryWords)) {
    return window.dictionaryWords;
  }
  return [];
}

// ✅ Daily seed
function getDailySeed() {
  const today = new Date();
  return Math.floor(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ) / 86400000);
}

// ✅ Load dictionary OR fallback
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

// ✅ Pick daily word
function pickDailyStartWord() {
  const seed = getDailySeed();
  return dictionary[seed % dictionary.length];
}

// ✅ Update UI
function updateDisplay() {
  document.getElementById("currentWord").textContent = currentWord;
  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = timeLeft;
}

// ✅ Messages
function showMessage(message, good = false) {
  const el = document.getElementById("message");
  el.textContent = message;
  el.style.color = good ? "green" : "red";
}

// ✅ Check 1 letter difference
function countLetterDifferences(a, b) {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff;
}

// ✅ Submit word
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

// ✅ Timer
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameEnded = true;

      document.getElementById("finalScore").textContent =
        `Time's up! Score: ${score}`;
    }
  }, 1000);
}

// ✅ Start game
function startGame2() {
  loadDictionary();

  currentWord = pickDailyStartWord();
  score = 0;
  timeLeft = GAME_TIME;
  usedWords = new Set([currentWord]);
  gameEnded = false;

  updateDisplay();
  showMessage("Change one letter.");

  startTimer();
}

// ✅ Events
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("submitBtn")
    .addEventListener("click", submitWord);

  document.getElementById("wordInput")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitWord();
    });

  startGame2();
});