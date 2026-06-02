/* ═══════════════════════════════════════════════════════════════
   Binokel Rechen-App — script.js
   New features: Setup screen (custom names), Dark/Light theme,
   Animated score counters, Row entrance animations.
   Game logic (calculateRound) is preserved exactly.
═══════════════════════════════════════════════════════════════ */

// ── DOM References ─────────────────────────────────────────────
const startScreen        = document.getElementById("startScreen");
const setupScreen        = document.getElementById("setupScreen");
const gameScreen         = document.getElementById("gameScreen");

const modeButtons        = document.querySelectorAll(".mode-card");
const setupBackBtn       = document.getElementById("setupBackBtn");
const nameInputGrid      = document.getElementById("nameInputGrid");
const startGameBtn       = document.getElementById("startGameBtn");
const setupSubtitle      = document.getElementById("setupSubtitle");

const backBtn            = document.getElementById("backBtn");
const berechnenBtn       = document.getElementById("berechnenBtn");
const undoBtn            = document.getElementById("undoBtn");
const resetBtn           = document.getElementById("resetBtn");

const reizwertInput      = document.getElementById("reizwert");
const spielerIndexSelect = document.getElementById("spielerIndex");
const macherLabel        = document.getElementById("macherLabel");
const scoreTableBody     = document.getElementById("scoreTableBody");
const historyHeaderRow   = document.getElementById("historyHeaderRow");
const historyBody        = document.getElementById("history");
const roundBadge         = document.getElementById("roundBadge");
const gameTitle          = document.getElementById("gameTitle");
const gameSubtitle       = document.getElementById("gameSubtitle");

const winnerModal        = document.getElementById("winnerModal");
const winnerTitle        = document.getElementById("winnerTitle");
const winnerText         = document.getElementById("winnerText");
const winnerCloseBtn     = document.getElementById("winnerCloseBtn");
const confettiLayer      = document.getElementById("confettiLayer");

const themeButtons       = document.querySelectorAll(".js-theme");

// ── Config ─────────────────────────────────────────────────────
const CONFIG = {
  3: {
    title:       "3 Spieler",
    subtitle:    "Einzelwertung für Spieler 1, Spieler 2 und Spieler 3",
    entityLabel: "Spieler",
    actorLabel:  "Spieler macht das Spiel",
    names:       ["Spieler 1", "Spieler 2", "Spieler 3"],
  },
  4: {
    title:       "4 Spieler / 2 Teams",
    subtitle:    "Teamwertung für Team 1 und Team 2 (2 gegen 2)",
    entityLabel: "Team",
    actorLabel:  "Team macht das Spiel",
    names:       ["Team 1", "Team 2"],
  },
};

// ── Game State ─────────────────────────────────────────────────
let currentMode  = null;
let gesamt       = [];
let runde        = 1;
let activeNames  = [];
let roundHistory = [];

/* ═══════════════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════════════ */
function getStoredTheme() {
  try { return localStorage.getItem("binokel-theme") || "light"; }
  catch { return "light"; }
}

function applyTheme(theme, animate = true) {
  if (animate) {
    document.body.classList.add("switching");
    setTimeout(() => document.body.classList.remove("switching"), 420);
  }

  document.documentElement.dataset.theme = theme;

  try { localStorage.setItem("binokel-theme", theme); } catch { /* ignore */ }

  const icon = theme === "dark" ? "☀️" : "🌙";
  themeButtons.forEach(btn => {
    const span = btn.querySelector(".theme-icon");
    if (span) span.textContent = icon;
  });
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

themeButtons.forEach(btn => btn.addEventListener("click", toggleTheme));

/* ═══════════════════════════════════════════════════════════════
   SCREENS
═══════════════════════════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id + "Screen");
  if (el) el.classList.add("active");
}

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
function sanitizeNumber(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

/**
 * Smooth number counter animation.
 * Animates the textContent of an element from `from` to `to`.
 */
function animateCounter(el, from, to, duration = 560) {
  if (from === to) { el.textContent = to; return; }
  const start = performance.now();
  const tick  = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════════════════
   SETUP SCREEN — name entry before game starts
═══════════════════════════════════════════════════════════════ */
function openSetup(mode) {
  currentMode = String(mode);
  const cfg   = CONFIG[currentMode];

  setupSubtitle.textContent =
    currentMode === "4"
      ? "Gebt euren 2 Teams ihre Namen."
      : "Gebt den 3 Spielern ihre Namen.";

  nameInputGrid.innerHTML = cfg.names
    .map((defaultName, i) => `
      <div class="name-card" style="animation-delay:${i * 75}ms">
        <div class="name-num">${i + 1}</div>
        <div class="name-field">
          <label class="name-lbl" for="nameInput${i}">
            ${escapeHtml(cfg.entityLabel)} ${i + 1}
          </label>
          <input
            type="text"
            id="nameInput${i}"
            class="name-input"
            value="${escapeHtml(defaultName)}"
            placeholder="${escapeHtml(defaultName)}"
            maxlength="22"
            autocomplete="off"
          />
        </div>
      </div>
    `)
    .join("");

  showScreen("setup");

  // Auto-focus + select first input after animation
  setTimeout(() => {
    const first = document.getElementById("nameInput0");
    if (first) { first.focus(); first.select(); }
  }, 210);
}

/**
 * Collect names from the setup screen and launch the game.
 */
function beginGame() {
  const cfg = CONFIG[currentMode];

  activeNames = cfg.names.map((defaultName, i) => {
    const input = document.getElementById(`nameInput${i}`);
    const val   = input?.value.trim();
    return val || defaultName;
  });

  gesamt       = Array(activeNames.length).fill(0);
  runde        = 1;
  roundHistory = [];

  buildScoreTable();
  buildActorSelect();
  buildHistoryHeader();
  resetInputs();
  updateRoundBadge();
  updateUndoState();

  gameTitle.textContent    = `Wertung – ${cfg.title}`;
  gameSubtitle.textContent = cfg.subtitle;
  macherLabel.textContent  = cfg.actorLabel;
  document.getElementById("entityHeader").textContent = cfg.entityLabel;

  historyBody.innerHTML = "";
  hideWinnerModal();
  showScreen("game");
}

/* ═══════════════════════════════════════════════════════════════
   SCORE TABLE
═══════════════════════════════════════════════════════════════ */
function buildScoreTable() {
  scoreTableBody.innerHTML = activeNames
    .map((name, index) => `
      <tr>
        <td class="entity-name">${escapeHtml(name)}</td>
        <td><input type="number" class="meldung"   data-index="${index}" value="0" /></td>
        <td><input type="number" class="gestochen" data-index="${index}" value="0" /></td>
        <td class="total-cell gesamt${index}">0</td>
      </tr>
    `)
    .join("");
}

function buildActorSelect() {
  spielerIndexSelect.innerHTML = activeNames
    .map((name, index) => `<option value="${index}">${escapeHtml(name)}</option>`)
    .join("");
}

function buildHistoryHeader() {
  historyHeaderRow.innerHTML = [
    "<th></th>",
    ...activeNames.map(name => `<th>${escapeHtml(name)}</th>`),
    "<th>Reizwert</th>",
  ].join("");
}

function resetInputs() {
  reizwertInput.value = 0;
  document.querySelectorAll(".meldung, .gestochen").forEach(input => {
    input.value = 0;
  });
  spielerIndexSelect.selectedIndex = 0;
  updateTotals();
}

/**
 * Update the "Gesamt" cells.
 * If `prevGesamt` is provided, the counter animates from the old value.
 */
function updateTotals(prevGesamt) {
  gesamt.forEach((wert, index) => {
    const cell = document.querySelector(`.gesamt${index}`);
    if (!cell) return;
    if (prevGesamt !== undefined) {
      animateCounter(cell, prevGesamt[index], wert);
    } else {
      cell.textContent = wert;
    }
  });
}

function updateRoundBadge() {
  roundBadge.textContent = `Runde ${runde}`;
  // Re-trigger badge animation
  roundBadge.style.animation = "none";
  void roundBadge.offsetWidth;
  roundBadge.style.animation = "";
}

function updateUndoState() {
  undoBtn.disabled = roundHistory.length === 0;
}

function getRoundValues() {
  const count        = activeNames.length;
  const meldungNodes  = document.querySelectorAll(".meldung");
  const gestochenNodes = document.querySelectorAll(".gestochen");
  const meld  = [];
  const stich = [];
  for (let i = 0; i < count; i += 1) {
    meld.push(sanitizeNumber(meldungNodes[i]?.value));
    stich.push(sanitizeNumber(gestochenNodes[i]?.value));
  }
  return { meld, stich };
}

/* ═══════════════════════════════════════════════════════════════
   GAME LOGIC — preserved exactly from original
═══════════════════════════════════════════════════════════════ */
function calculateRound({ meld, stich, reizwert, actorIndex }) {
  const count        = activeNames.length;
  const rundenpunkte = Array(count).fill(0);
  const spielerSumme = meld[actorIndex] + stich[actorIndex];

  if (meld[actorIndex] === -reizwert) {
    // Bettel / special game
    rundenpunkte[actorIndex] = -reizwert;
    for (let i = 0; i < count; i += 1) {
      if (i !== actorIndex) {
        rundenpunkte[i] = meld[i] + Math.floor(reizwert / 2);
      }
    }
  } else if (spielerSumme >= reizwert) {
    // Macher wins
    rundenpunkte[actorIndex] = spielerSumme;
    for (let i = 0; i < count; i += 1) {
      if (i !== actorIndex) {
        rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
      }
    }
  } else {
    // Macher loses
    rundenpunkte[actorIndex] = -reizwert * 2;
    for (let i = 0; i < count; i += 1) {
      if (i !== actorIndex) {
        rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
      }
    }
  }

  return rundenpunkte;
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY
═══════════════════════════════════════════════════════════════ */
function appendHistoryRows({ meld, stich, reizwert, actorIndex, rundenpunkte, winner }) {
  const winnerClass = winner ? " winner-row" : "";

  const rowMeld = document.createElement("tr");
  rowMeld.className = "row-enter" + winnerClass;
  rowMeld.innerHTML = `
    <td class="runde-row-label">
      Runde ${runde}
      <span class="runde-sub">Gemeldet · ${escapeHtml(activeNames[actorIndex])} macht das Spiel</span>
    </td>
    ${meld.map(v => `<td>${v}</td>`).join("")}
    <td>${reizwert}</td>
  `;

  const rowStich = document.createElement("tr");
  rowStich.className = "row-enter" + winnerClass;
  rowStich.style.animationDelay = "55ms";
  rowStich.innerHTML = `
    <td class="runde-row-label">
      Punkte
      <span class="runde-sub">Gestochen / gewertete Runde</span>
    </td>
    ${rundenpunkte.map((value, i) =>
      `<td>${stich[i]} <span class="runde-sub">→ ${value}</span></td>`
    ).join("")}
    <td>–</td>
  `;

  historyBody.appendChild(rowMeld);
  historyBody.appendChild(rowStich);

  // Scroll history panel to the latest round
  const wrapper = document.querySelector(".history-wrap");
  if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;

  return { rowMeld, rowStich };
}

/* ═══════════════════════════════════════════════════════════════
   WINNER MODAL
═══════════════════════════════════════════════════════════════ */
function showWinnerModal(name, punkte) {
  winnerTitle.textContent = `${name} hat gewonnen!`;
  winnerText.textContent  = `${name} hat mindestens 1000 Punkte erreicht. Aktueller Stand: ${punkte} Punkte.`;
  winnerModal.classList.remove("hidden");
  winnerModal.setAttribute("aria-hidden", "false");
  launchConfetti();
}

function hideWinnerModal() {
  winnerModal.classList.add("hidden");
  winnerModal.setAttribute("aria-hidden", "true");
  confettiLayer.innerHTML = "";
}

function launchConfetti() {
  confettiLayer.innerHTML = "";
  const colors = [
    "#d4a830", "#e05050", "#4ecdc4",
    "#5b8def", "#9b5de5", "#3aa76d", "#ff8c42",
  ];
  for (let i = 0; i < 34; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left             = `${Math.random() * 100}%`;
    piece.style.background       = colors[i % colors.length];
    piece.style.animationDuration = `${2.0 + Math.random() * 2.2}s`;
    piece.style.animationDelay   = `${Math.random() * 0.45}s`;
    piece.style.transform        = `rotate(${Math.random() * 260}deg)`;
    piece.style.width            = `${8 + Math.random() * 6}px`;
    confettiLayer.appendChild(piece);
  }
}

/* ═══════════════════════════════════════════════════════════════
   RESET & UNDO
═══════════════════════════════════════════════════════════════ */
function resetGame() {
  if (!currentMode) return;
  gesamt       = Array(activeNames.length).fill(0);
  runde        = 1;
  roundHistory = [];
  historyBody.innerHTML = "";
  buildScoreTable();
  buildActorSelect();
  resetInputs();
  updateRoundBadge();
  updateUndoState();
  hideWinnerModal();
}

function undoLastRound() {
  if (roundHistory.length === 0) return;
  hideWinnerModal();

  const lastRound  = roundHistory.pop();
  const prevGesamt = [...gesamt];
  gesamt = gesamt.map((wert, i) => wert - lastRound.rundenpunkte[i]);
  updateTotals(prevGesamt);

  if (lastRound.rowMeld?.parentNode)  lastRound.rowMeld.remove();
  if (lastRound.rowStich?.parentNode) lastRound.rowStich.remove();

  reizwertInput.value        = lastRound.reizwert;
  spielerIndexSelect.value   = String(lastRound.actorIndex);

  document.querySelectorAll(".meldung").forEach((input, i) => {
    input.value = lastRound.meld[i] ?? 0;
  });
  document.querySelectorAll(".gestochen").forEach((input, i) => {
    input.value = lastRound.stich[i] ?? 0;
  });

  runde = Math.max(1, runde - 1);
  updateRoundBadge();
  updateUndoState();
}

/* ═══════════════════════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════════════════════ */

// Mode selection → Setup screen
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => openSetup(btn.dataset.mode));
});

// Setup navigation
setupBackBtn.addEventListener("click", () => showScreen("start"));
startGameBtn.addEventListener("click", beginGame);

// Allow Enter key anywhere on the setup screen to proceed
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && setupScreen.classList.contains("active")) {
    e.preventDefault();
    beginGame();
  }
});

// Back to start from game
backBtn.addEventListener("click", () => {
  hideWinnerModal();
  showScreen("start");
});

// Calculate round
berechnenBtn.addEventListener("click", () => {
  if (!currentMode) return;

  const reizwert   = sanitizeNumber(reizwertInput.value);
  const actorIndex = sanitizeNumber(spielerIndexSelect.value);
  const { meld, stich } = getRoundValues();
  const rundenpunkte    = calculateRound({ meld, stich, reizwert, actorIndex });

  const prevGesamt = [...gesamt];
  gesamt = gesamt.map((wert, i) => wert + rundenpunkte[i]);
  updateTotals(prevGesamt);

  const winner = gesamt[actorIndex] >= 1000 && rundenpunkte[actorIndex] > 0;
  const rows   = appendHistoryRows({ meld, stich, reizwert, actorIndex, rundenpunkte, winner });

  roundHistory.push({
    reizwert,
    actorIndex,
    meld:          [...meld],
    stich:         [...stich],
    rundenpunkte:  [...rundenpunkte],
    rowMeld:       rows.rowMeld,
    rowStich:      rows.rowStich,
  });

  updateUndoState();

  if (winner) {
    const winnerCell = document.querySelector(`.gesamt${actorIndex}`);
    winnerCell?.classList.add("winner-highlight");
    setTimeout(() => winnerCell?.classList.remove("winner-highlight"), 3500);
    showWinnerModal(activeNames[actorIndex], gesamt[actorIndex]);
  }

  runde += 1;
  updateRoundBadge();
});

// Undo / Reset
undoBtn.addEventListener("click",  undoLastRound);
resetBtn.addEventListener("click", resetGame);

// Close modal
winnerCloseBtn.addEventListener("click", hideWinnerModal);
winnerModal.addEventListener("click", e => {
  if (e.target.classList.contains("modal-backdrop")) hideWinnerModal();
});

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
applyTheme(getStoredTheme(), false);
