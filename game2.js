const ROUNDS = [
  { round: 1, wordLength: 4, time: 60, points: 1 },
  { round: 2, wordLength: 5, time: 60, points: 2 },
  { round: 3, wordLength: 6, time: 60, points: 4 }
];

const roundWords = {
  4: ["COLD", "CARD", "HAND", "SCUM", "FISH", "JACK","BOOK", "WORD", "FORK", "LAMP"],
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
let finalScoreValue = 0;
let statsSavedThisGame = false;

function getTodayId() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

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
  if (!el) return;

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
    showMessage(`Enter a ${config.wordLength}-letter word.`, "error");
    return;
  }

  if (!Array.isArray(dictionary) || dictionary.length === 0) {
    showMessage("Dictionary still loading. Try again.", "error");
    return;
  }

  if (!dictionary.includes(newWord)) {
    showMessage("Not in dictionary.", "error");
    return;
  }

  if (newWord === currentWord) {
    showMessage("Change one letter.", "error");
    return;
  }

  if (usedWords.has(newWord)) {
    showMessage("Already used.", "error");
    return;
  }

  if (countLetterDifferences(currentWord, newWord) !== 1) {
    showMessage("Only one letter can change.", "error");
    return;
  }

  currentWord = newWord;
  usedWords.add(newWord);
  score += config.points;

  updateDisplay();
  showMessage(`Good! +${config.points}`, "good");
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
    `Round ${config.round}: change one letter at a time. ${config.points} point${config.points > 1 ? "s" : ""} per word.`
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

async function saveWordStepsStats(finalScore) {
  if (statsSavedThisGame) return;

  const auth = window.auth;
  const db = window.db;

  if (!auth || !auth.currentUser || !db || !window.doc || !window.getDoc || !window.setDoc) {
    return;
  }

  statsSavedThisGame = true;

  const uid = auth.currentUser.uid;
  const statsRef = window.doc(db, "users", uid, "stats", "wordSteps");

  try {
    const statsSnap = await window.getDoc(statsRef);
    const todayId = getTodayId();

    let oldStats = {
      timesPlayed: 0,
      highestScore: 0,
      totalScore: 0,
      averageScore: 0,
      longestStreak: 0,
      currentStreak: 0,
      lastPlayedDay: ""
    };

    if (statsSnap.exists()) {
      oldStats = {
        ...oldStats,
        ...statsSnap.data()
      };
    }

    const timesPlayed = (oldStats.timesPlayed || 0) + 1;
    const totalScore = (oldStats.totalScore || 0) + finalScore;
    const highestScore = Math.max(oldStats.highestScore || 0, finalScore);
    const averageScore = Math.round(totalScore / timesPlayed);

    let currentStreak = oldStats.currentStreak || 0;
    let longestStreak = oldStats.longestStreak || 0;

    if (oldStats.lastPlayedDay !== todayId) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    await window.setDoc(statsRef, {
      timesPlayed,
      highestScore,
      totalScore,
      averageScore,
      longestStreak,
      currentStreak,
      lastPlayedDay: todayId
    });

  } catch (error) {
    console.error("Error saving Word Steps stats:", error);
  }
}

function endGame(message) {
  clearInterval(timerInterval);
  gameEnded = true;
  finalScoreValue = score;

  const finalScoreEl = document.getElementById("finalScore");

  if (finalScoreEl) {
    finalScoreEl.textContent = message;
  }

  const endScreen = document.getElementById("endScreen");

  if (endScreen) {
    endScreen.style.display = "flex";
  }

  saveWordStepsStats(finalScoreValue);
  showMessage("Game ended.");
}

function startGame2() {
  clearInterval(timerInterval);

  score = 0;
  finalScoreValue = 0;
  statsSavedThisGame = false;
  gameEnded = false;
  roundTransitioning = false;

  const endScreen = document.getElementById("endScreen");

  if (endScreen) {
    endScreen.style.display = "none";
  }

  const finalScoreEl = document.getElementById("finalScore");

  if (finalScoreEl) {
    finalScoreEl.textContent = "";
  }

  startRound(0);
}

async function submitFinalScore() {
  const scoreToSubmit = finalScoreValue || score;

  if (!window.auth || !window.auth.currentUser) {
    localStorage.setItem("pendingWordStepsScore", String(scoreToSubmit));
    window.location.href = "account.html";
    return;
  }

  if (typeof window.submitRobTechScore !== "function") {
    alert("Leaderboard system is still loading. Try again in a second.");
    return;
  }

  await saveWordStepsStats(scoreToSubmit);
  await window.submitRobTechScore(scoreToSubmit);
}

function waitForAuthThenSubmitPendingScore() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("submitPendingScore") !== "true") {
    return;
  }

  const pendingScore = localStorage.getItem("pendingWordStepsScore");

  if (!pendingScore) {
    return;
  }

  const checkAuth = setInterval(async () => {
    if (window.auth && window.auth.currentUser && typeof window.submitRobTechScore === "function") {
      clearInterval(checkAuth);

      const scoreNumber = Number(pendingScore);
      localStorage.removeItem("pendingWordStepsScore");

      await saveWordStepsStats(scoreNumber);
      await window.submitRobTechScore(scoreNumber);
    }
  }, 500);
}

function goToAccount() {
  window.location.href = "account.html";
}

function goToProfile() {
  window.location.href = "profile.html";
}

function goToLeaderboard() {
  window.location.href = "leaderboard.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");
  const wordInput = document.getElementById("wordInput");
  const playAgainBtn = document.getElementById("playAgainBtn");

  const submitScoreBtn = document.getElementById("submitScoreBtn");
  const accountBtn = document.getElementById("accountBtn");
  const loginBtn = document.getElementById("loginBtn");
  const profileBtn = document.getElementById("profileBtn");
  const leaderboardBtn = document.getElementById("leaderboardBtn");

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

  if (submitScoreBtn) {
    submitScoreBtn.addEventListener("click", submitFinalScore);
  }

  if (accountBtn) {
    accountBtn.addEventListener("click", goToAccount);
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", goToAccount);
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", goToProfile);
  }

  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", goToLeaderboard);
  }

  waitForAuthThenSubmitPendingScore();
});