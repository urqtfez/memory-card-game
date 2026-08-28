// ชุดข้อมูลสัญลักษณ์แยกหมวดหมู่
const CATEGORIES = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
  fruits: ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🥝', '🍑', '🥑'],
  sweets: ['🍩', '🍦', '🍰', '🍪', '🍫', '🍬', '🧁', '🍮', '🥞', '🍭']
};

let currentCategory = 'animals';
let difficulty = 'easy'; // easy = 3x4 (12 ใบ / 6 คู่), normal = 4x4 (16 ใบ / 8 คู่)
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 6;
let score = 0;
let bestScore = parseInt(localStorage.getItem('memory_game_best_score')) || 0;
let combo = 1;
let maxCombo = 1;
let turns = 0;
let timer = 0;
let timerInterval = null;
let lockBoard = false;
let soundEnabled = true;

// Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playBeep(freq, type = 'sine', duration = 0.1) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const gridEl = document.getElementById('grid');
const timeEl = document.getElementById('time');
const turnsEl = document.getElementById('turns');
const comboEl = document.getElementById('combo');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const winModal = document.getElementById('winModal');
const newRecordNotice = document.getElementById('newRecordNotice');

function initGame() {
  clearInterval(timerInterval);
  timerInterval = null;
  timer = 0;
  turns = 0;
  score = 0;
  combo = 1;
  maxCombo = 1;
  matchedPairs = 0;
  flippedCards = [];
  lockBoard = false;

  timeEl.textContent = '00:00';
  turnsEl.textContent = '00';
  comboEl.textContent = 'x1';
  scoreEl.textContent = '0';
  bestScoreEl.textContent = bestScore;
  winModal.classList.remove('show');
  newRecordNotice.style.display = 'none';

  totalPairs = difficulty === 'easy' ? 6 : 8;
  gridEl.className = `grid-container grid-${difficulty === 'easy' ? '3x4' : '4x4'}`;

  const activeIcons = CATEGORIES[currentCategory] || CATEGORIES.animals;
  const selectedIcons = activeIcons.slice(0, totalPairs);
  const deck = [...selectedIcons, ...selectedIcons].sort(() => Math.random() - 0.5);

  gridEl.innerHTML = '';
  deck.forEach((icon, idx) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.icon = icon;
    card.dataset.index = idx;
    card.innerHTML = `
      <div class="card-face card-front">?</div>
      <div class="card-face card-back">${icon}</div>
    `;
    card.addEventListener('click', () => flipCard(card));
    gridEl.appendChild(card);
  });
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timer++;
    const mins = String(Math.floor(timer / 60)).padStart(2, '0');
    const secs = String(timer % 60).padStart(2, '0');
    timeEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function flipCard(card) {
  if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;

  startTimer();
  card.classList.add('flipped');
  playBeep(400, 'sine', 0.08);
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    turns++;
    turnsEl.textContent = String(turns).padStart(2, '0');
    checkMatch();
  }
}

function checkMatch() {
  lockBoard = true;
  const [card1, card2] = flippedCards;
  const isMatch = card1.dataset.icon === card2.dataset.icon;

  if (isMatch) {
    setTimeout(() => {
      card1.classList.add('matched');
      card2.classList.add('matched');
      score += 100 * combo;
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      matchedPairs++;

      scoreEl.textContent = score;
      comboEl.textContent = `x${combo}`;
      playBeep(600, 'triangle', 0.2);

      // อัปเดต Best Score ทันทีถ้าคะแนนแซงสถิติเดิม
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('memory_game_best_score', bestScore);
        bestScoreEl.textContent = bestScore;
      }

      resetTurn();
      if (matchedPairs === totalPairs) handleGameOver();
    }, 400);
  } else {
    card1.classList.add('wrong');
    card2.classList.add('wrong');
    playBeep(200, 'sawtooth', 0.15);

    setTimeout(() => {
      card1.classList.remove('flipped', 'wrong');
      card2.classList.remove('flipped', 'wrong');
      combo = 1;
      comboEl.textContent = 'x1';
      resetTurn();
    }, 900);
  }
}

function resetTurn() {
  flippedCards = [];
  lockBoard = false;
}

function handleGameOver() {
  clearInterval(timerInterval);
  timerInterval = null;

  let isNewRecord = false;
  if (score >= bestScore && score > 0) {
    bestScore = score;
    localStorage.setItem('memory_game_best_score', bestScore);
    isNewRecord = true;
  }

  setTimeout(() => {
    document.getElementById('finalTime').textContent = timeEl.textContent;
    document.getElementById('finalTurns').textContent = turns;
    document.getElementById('finalCombo').textContent = `x${maxCombo}`;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalBest').textContent = bestScore;

    if (isNewRecord) {
      newRecordNotice.style.display = 'block';
    }

    winModal.classList.add('show');
    playBeep(800, 'sine', 0.4);
  }, 500);
}

// Event Listeners: เลือกระดับความยาก
document.querySelectorAll('.btn-diff').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.btn-diff').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    difficulty = e.target.dataset.diff;
    initGame();
  });
});

// Event Listeners: เลือกหมวดหมู่อิโมจิ
document.querySelectorAll('.btn-cat').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.btn-cat').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentCategory = e.target.dataset.cat;
    initGame();
  });
});

document.getElementById('restartBtn').addEventListener('click', initGame);
document.getElementById('playAgainBtn').addEventListener('click', initGame);

document.getElementById('soundToggle').addEventListener('click', (e) => {
  soundEnabled = !soundEnabled;
  e.target.textContent = soundEnabled ? '🔊' : '🔇';
});

// เริ่มต้นเกม
initGame();
