const ROUNDS = [
  { round: 1, wordLength: 4, time: 60, points: 1 },
  { round: 2, wordLength: 5, time: 60, points: 2 },
  { round: 3, wordLength: 6, time: 60, points: 4 }
];

const roundWords = {
  4: ["COLD", "CARD", "HAND", "FISH", "BOOK", "WORD", "FORK", "LAMP"],
  5: ["STONE", "PLANE", "SMILE", "CRANE", "BRICK", "SHINE", "GRASS", "TRAIN"],
  6: ["PLANET", "STREAM", "BRIGHT", "MARKET", "SILVER", "POCKET", "GARDEN", "WINTER"]
};

let currentRoundIndex = 0;
let currentWord = "";
let score = 0;
let timeLeft = 0;
let timerInterval = null;
let usedWords = new Set();
let gameEnded = false;
let roundTransitioning = false;

function getDailySeed() {
  const today = new Date();
  return Math.floor(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ) / 86400000);
}

function pickDailyStartWord(wordLength) {
  const words = roundWords[wordLength];
  const seed = getDailySeed() + currentRoundIndex;
  return words[seed % words.length];
}

function updateDisplay() {
  document.getElementById("currentWord").textContent = currentWord;
  document.getElementById("score").textContent = score;
  document.getElementById("time").textContent = timeLeft;

  const roundEl = document.getElementById("round");
  if (roundEl) {
    roundEl.textContent = currentRoundIndex + 1;
  }
}

function showMessage(message, type = "normal") {
  const el = document.getElementById("message");
  el.textContent = message;

  if (type === "good") el.style.color = "limegreen";
  else if (type === "error") el.style.color = "red";
  else el.style.color = "black";
}

function countLetterDifferences(a, b) {
  if (a.length !== b.length) return 99;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff;
}

function getCurrentRoundConfig() {
  return ROUNDS[currentRoundIndex];
}

function getDictionaryForLength(length) {
  if (!Array.isArray(dictionary)) return [];
  return dictionary.filter(word => word.length === length);
}

function getValidMoves(word) {
  const dict = getDictionaryForLength(word.length);
  return dict.filter(candidate =>
    candidate !== word &&
    !usedWords.has(candidate) &&
    countLetterDifferences(word, candidate) === 1
  );
}

function submitWord() {
  if (gameEnded || roundTransitioning) return;

  const input = document.getElementById("wordInput");
  const newWord = input.value.trim().toUpperCase();
  const config = getCurrentRoundConfig();

  if (!new RegExp(`^[A-Z]{${config.wordLength}}$`).test(newWord)) {
    showMessage(`Enter a ${config.wordLength}-letter word.`);
    return;
  }

  if (!Array.isArray(dictionary) || dictionary.length === 0) {
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
  score += config.points;

  updateDisplay();
  showMessage(`Good! +${config.points}`, true);
  input.value = "";

  const remainingMoves = getValidMoves(currentWord);
  if (remainingMoves.length === 0) {
    endGame("No more possible words.");
  }
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeLeft = 0;
      updateDisplay();
      moveToNextRoundOrEnd();
    }
  }, 1000);
}

function showRoundPopup(message, callback) {
  roundTransitioning = true;

  const popup = document.getElementById("roundPopup");
  const text = document.getElementById("roundPopupText");
  const countdown = document.getElementById("roundCountdown");

  if (!popup || !text || !countdown) {
    callback();
    roundTransitioning = false;
    return;
  }

  popup.style.display = "flex";
  text.textContent = message;

  let count = 3;
  countdown.textContent = count;

  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdown.textContent = count;
    } else {
      clearInterval(countdownInterval);
      popup.style.display = "none";
      roundTransitioning = false;
      callback();
    }
  }, 1000);
}

function startRound(index) {
  currentRoundIndex = index;
  const config = getCurrentRoundConfig();
  document.body.classList.remove("round-1", "round-2", "round-3");
document.body.classList.add(`round-${config.round}`);

  currentWord = pickDailyStartWord(config.wordLength);
  usedWords = new Set([currentWord]);
  timeLeft = config.time;

  document.getElementById("wordInput").value = "";

  updateDisplay();
  showMessage(
    `Round ${config.round}: change one letter at a time. ${config.points} point${config.points > 1 ? "s" : ""} per word.`,
  );

  if (getValidMoves(currentWord).length === 0) {
    endGame("No possible moves from the starting word.");
    return;
  }

  startTimer();
}

function moveToNextRoundOrEnd() {
  if (currentRoundIndex < ROUNDS.length - 1) {
    const nextConfig = ROUNDS[currentRoundIndex + 1];

    showRoundPopup(
      `Round ${nextConfig.round} - words are now worth ${nextConfig.points} point${nextConfig.points > 1 ? "s" : ""}`,
      () => {
        startRound(currentRoundIndex + 1);
      }
    );
  } else {
    endGame(`Game over! You scored ${score} points.`);
  }
}

function endGame(message) {
  clearInterval(timerInterval);
  gameEnded = true;

  const finalScoreEl = document.getElementById("finalScore");
  if (finalScoreEl) {
    finalScoreEl.textContent = message;
  }

  const endScreen = document.getElementById("endScreen");
  if (endScreen) {
    endScreen.style.display = "flex";
  }

  showMessage("Game ended.");
}

function startGame2() {
  clearInterval(timerInterval);

  score = 0;
  gameEnded = false;
  roundTransitioning = false;

  const endScreen = document.getElementById("endScreen");
  if (endScreen) {
    endScreen.style.display = "none";
  }

  document.getElementById("finalScore").textContent = "";

  startRound(0);
}

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const wordInput = document.getElementById("wordInput");
  const playAgainBtn = document.getElementById("playAgainBtn");

  if (submitBtn) {
    submitBtn.addEventListener("click", submitWord);
  }

  if (wordInput) {
    wordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitWord();
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", startGame2);
  }

});