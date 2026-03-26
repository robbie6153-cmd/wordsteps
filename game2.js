const GAME_TIME = 200;
const fallbackWords = [
  "COLD", "CARD", "HAND", "FISH", "BOOK", "WORD", "FORK", "LAMP",
  "MIND", "WALL", "MILK", "RING", "SAND", "FIRE", "WIND", "TREE",
  "BELL", "SHIP", "ROAD", "STAR", "MOON", "PLAN", "GAME", "STEP"
];

let dictionary = [];
let currentWord = "";
let score = 0;
let timeLeft = GAME_TIME;
let timerInterval = null;
let usedWords = new Set();
let gameEnded = false;

function pickDailyStartWord() {
  const usableWords = dictionary.length > 0 ? dictionary : fallbackWords;
  const seed = getDailySeed();
  return usableWords[seed % usableWords.length];
}

function getDictionaryArray() {
  if (typeof window.getDictionaryArray === "function") {
    return window.getDictionaryArray();
  }

  if (Array.isArray(window.dictionaryWords)) {
    return window.dictionaryWords;
  }

  return [];
}

function getDailySeed() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  const utcDate = Date.UTC(year, month, day);
  return Math.floor(utcDate / 86400000);
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
  if (!dictionary.length) {
    return "WORD";
  }

  const seed = getDailySeed();
  return dictionary[seed % dictionary.length];
}

function updateDisplay() {
  const currentWordEl = document.getElementById("currentWord");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");

  if (currentWordEl) currentWordEl.textContent = currentWord;
  if (scoreEl) scoreEl.textContent = score;
  if (timeEl) timeEl.textContent = timeLeft;
}

function showMessage(message, good = false) {
  const messageEl = document.getElementById("message");
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.style.color = good ? "green" : "red";
}

function countLetterDifferences(word1, word2) {
  if (word1.length !== word2.length) return 99;

  let differences = 0;

  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
    }
  }

  return differences;
}

function isValidDictionaryWord(word) {
  return dictionary.includes(word);
}

function submitWord() {
  if (gameEnded) return;

  const inputEl = document.getElementById("wordInput");
  if (!inputEl) return;

  const newWord = inputEl.value.trim().toUpperCase();

  if (!/^[A-Z]{4}$/.test(newWord)) {
    showMessage("Enter a valid 4-letter word.");
    return;
  }

  if (newWord === currentWord) {
    showMessage("You must change one letter.");
    return;
  }

  if (usedWords.has(newWord)) {
    showMessage("You already used that word.");
    return;
  }

  if (!isValidDictionaryWord(newWord)) {
    showMessage("That word is not in the dictionary.");
    return;
  }

  if (countLetterDifferences(currentWord, newWord) !== 1) {
    showMessage("You can only change one letter at a time.");
    return;
  }

  currentWord = newWord;
  usedWords.add(newWord);
  score++;
  updateDisplay();
  showMessage("Good word!", true);

  inputEl.value = "";
  inputEl.focus();
}

function endGame() {
  gameEnded = true;
  clearInterval(timerInterval);
  timerInterval = null;

  const inputEl = document.getElementById("wordInput");
  const submitBtn = document.getElementById("submitBtn");
  const finalScoreEl = document.getElementById("finalScore");

  if (inputEl) inputEl.disabled = true;
  if (submitBtn) submitBtn.disabled = true;

  if (finalScoreEl) {
    finalScoreEl.textContent = `Time's up! You scored ${score} point${score === 1 ? "" : "s"}.`;
  }

  showMessage("Game over.");
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateDisplay();
      endGame();
    }
  }, 1000);
}

function startGame2() {
  loadDictionary();

  currentWord = pickDailyStartWord();
  score = 0;
  timeLeft = GAME_TIME;
  usedWords = new Set([currentWord]);
  gameEnded = false;

  const inputEl = document.getElementById("wordInput");
  const submitBtn = document.getElementById("submitBtn");
  const finalScoreEl = document.getElementById("finalScore");

  if (inputEl) {
    inputEl.disabled = false;
    inputEl.value = "";
  }

  if (submitBtn) {
    submitBtn.disabled = false;
  }

  if (finalScoreEl) {
    finalScoreEl.textContent = "";
  }

  updateDisplay();
  showMessage("Change one letter to make a new 4-letter word.", true);
  startTimer();

  if (inputEl) inputEl.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const inputEl = document.getElementById("wordInput");

  if (submitBtn) {
    submitBtn.addEventListener("click", submitWord);
  }

  if (inputEl) {
    inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submitWord();
      }
    });
  }

  startGame2();
});