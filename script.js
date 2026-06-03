/* ═══════════════════════════════════════════════════════════════
   Binokel Rechen-App — script.js (v3)
   Neue Features:
   · Zielpunktzahl (freie Eingabe)
   · Negative Punkte farblich markiert
   · Spielstand-Persistenz (localStorage)
   · Runden-Modus (Punkte ODER feste Anzahl Runden)
   · Eingabevalidierung
   · Accordion-Verlauf
   · Undo-Toast
   · Tastatur-Navigation (Enter → Berechnen)
   · Meldungsrechner (Württembergisch)
   · Regelübersicht
   · calculateRound: exakt wie Original erhalten
═══════════════════════════════════════════════════════════════ */

// ── DOM References ─────────────────────────────────────────────
const $id  = id => document.getElementById(id);
const startScreen        = $id("startScreen");
const setupScreen        = $id("setupScreen");
const gameScreen         = $id("gameScreen");
const setupBackBtn       = $id("setupBackBtn");
const nameInputGrid      = $id("nameInputGrid");
const startGameBtn       = $id("startGameBtn");
const setupSubtitle      = $id("setupSubtitle");
const backBtn            = $id("backBtn");
const berechnenBtn       = $id("berechnenBtn");
const undoBtn            = $id("undoBtn");
const resetBtn           = $id("resetBtn");
const reizwertInput      = $id("reizwert");
const spielerIndexSelect = $id("spielerIndex");
const macherLabel        = $id("macherLabel");
const scoreTableBody     = $id("scoreTableBody");
const scoreTable         = $id("scoreTable");
const historyList        = $id("historyList");
const historyEmpty       = $id("historyEmpty");
const roundBadge         = $id("roundBadge");
const gameTitle          = $id("gameTitle");
const gameSubtitle       = $id("gameSubtitle");
const progressTh         = $id("progressTh");
const validationError    = $id("validationError");
const winnerModal        = $id("winnerModal");
const winnerTitle        = $id("winnerTitle");
const winnerText         = $id("winnerText");
const winnerCloseBtn     = $id("winnerCloseBtn");
const confettiLayer      = $id("confettiLayer");
const regelModal         = $id("regelModal");
const regelBtn           = $id("regelBtn");
const meldModal          = $id("meldModal");
const meldungsBtn        = $id("meldungsBtn");
const meldBody           = $id("meldBody");
const meldTotal          = $id("meldTotal");
const meldApplyName      = $id("meldApplyName");
const meldApplyBtn       = $id("meldApplyBtn");
const meldResetBtn       = $id("meldResetBtn");
const restoreModal       = $id("restoreModal");
const restoreInfo        = $id("restoreInfo");
const restoreYesBtn      = $id("restoreYesBtn");
const restoreNoBtn       = $id("restoreNoBtn");
const toast              = $id("toast");
const toastMsg           = $id("toastMsg");
const themeButtons       = document.querySelectorAll(".js-theme");

// ── Config ─────────────────────────────────────────────────────
const CONFIG = {
  3: {
    title: "3 Spieler",
    subtitle: "Einzelwertung – Spieler 1, Spieler 2 und Spieler 3",
    entityLabel: "Spieler",
    actorLabel:  "Spieler macht das Spiel",
    names: ["Spieler 1", "Spieler 2", "Spieler 3"],
  },
  4: {
    title: "4 Spieler / 2 Teams",
    subtitle: "Teamwertung – Team 1 und Team 2 (2 gegen 2)",
    entityLabel: "Team",
    actorLabel:  "Team macht das Spiel",
    names: ["Team 1", "Team 2"],
  },
};

// ── Württembergische Binokel Meldungen ─────────────────────────
const MELDUNGEN_DATA = [
  {
    category: "Binokel",
    items: [
      { id:"binokel",       name:"Binokel",         desc:"♠U + ♦O",                   punkte:40,   max:1 },
      { id:"doppelbinokel", name:"Doppelbinokel",   desc:"beide ♠U + beide ♦O",       punkte:300,  max:1 },
    ],
  },
  {
    category: "Heiraten",
    items: [
      { id:"heirat_tr",  name:"Heirat (Trumpf)",          desc:"K + O in Trumpffarbe",          punkte:40,  max:1 },
      { id:"heirat_nt",  name:"Heirat (außer Trumpf)",    desc:"K + O in einer Farbe",          punkte:20,  max:3 },
      { id:"dheirat_tr", name:"Doppelheirat (Trumpf)",    desc:"beide K + beide O in Trumpf",   punkte:80,  max:1 },
      { id:"dheirat_nt", name:"Doppelheirat (a. Trumpf)", desc:"beide K + beide O in einer F.", punkte:40,  max:3 },
    ],
  },
  {
    category: "Vierlinge",
    items: [
      { id:"v_unter",  name:"Vier Unter",  desc:"alle 4 Unter (Buben)", punkte:40,  max:1 },
      { id:"v_ober",   name:"Vier Ober",   desc:"alle 4 Ober (Damen)",  punkte:60,  max:1 },
      { id:"v_koenig", name:"Vier Könige", desc:"alle 4 Könige",        punkte:80,  max:1 },
      { id:"v_ass",    name:"Vier Asse",   desc:"alle 4 Asse",          punkte:100, max:1 },
      { id:"v_zehn",   name:"Vier Zehner", desc:"alle 4 Zehner",        punkte:100, max:1 },
    ],
  },
  {
    category: "Doppel-Vierlinge",
    items: [
      { id:"dv_unter",  name:"Doppel-Vier Unter",  desc:"alle 8 Unter",  punkte:400,  max:1 },
      { id:"dv_ober",   name:"Doppel-Vier Ober",   desc:"alle 8 Ober",   punkte:600,  max:1 },
      { id:"dv_koenig", name:"Doppel-Vier Könige", desc:"alle 8 Könige", punkte:800,  max:1 },
      { id:"dv_ass",    name:"Doppel-Vier Asse",   desc:"alle 8 Asse",   punkte:1000, max:1 },
      { id:"dv_zehn",   name:"Doppel-Vier Zehner", desc:"alle 8 Zehner", punkte:1000, max:1 },
    ],
  },
  {
    category: "Sequenzen / Familien",
    items: [
      { id:"sequenz",   name:"Sequenz",       desc:"A, 10, K, O, U in Trumpf",         punkte:150,  max:1 },
      { id:"dsequenz",  name:"Doppelsequenz", desc:"beide Sequenzen in Trumpf",        punkte:1500, max:1 },
    ],
  },
];

// ── State ───────────────────────────────────────────────────────
let currentMode  = null;
let activeNames  = [];
let gesamt       = [];
let runde        = 1;
let roundHistory = [];  // { reizwert, actorIndex, meld, stich, rundenpunkte, result, historyEl }
let gameMode     = "punkte";   // "punkte" | "runden"
let zielPunkte   = 1000;
let maxRunden    = 10;
let activeGmTab  = "punkte";
let meldCounts   = {};
let toastTimer   = null;

const SAVE_KEY   = "binokel_v3_state";

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
function sanitizeNumber(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function animateCounter(el, from, to, duration = 560) {
  if (from === to) { el.textContent = to; return; }
  const start = performance.now();
  const tick  = now => {
    const p     = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

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
  try { localStorage.setItem("binokel-theme", theme); } catch {}
  const icon = theme === "dark" ? "☀️" : "🌙";
  themeButtons.forEach(btn => {
    const s = btn.querySelector(".theme-icon");
    if (s) s.textContent = icon;
  });
}

themeButtons.forEach(btn => btn.addEventListener("click", () => {
  const cur = document.documentElement.dataset.theme || "light";
  applyTheme(cur === "dark" ? "light" : "dark");
}));

/* ═══════════════════════════════════════════════════════════════
   SCREENS
═══════════════════════════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = $id(id + "Screen");
  if (el) el.classList.add("active");
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function showToast(msg, duration = 3200) {
  toastMsg.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

/* ═══════════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════════ */
function showValidationError(msg) {
  validationError.textContent = msg;
  validationError.classList.add("show");
}

function clearValidationError() {
  validationError.classList.remove("show");
}

// Clear on any input change
reizwertInput.addEventListener("input", clearValidationError);

/* ═══════════════════════════════════════════════════════════════
   SETUP SCREEN — Game Mode Tabs
═══════════════════════════════════════════════════════════════ */
document.querySelectorAll(".gm-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".gm-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeGmTab = tab.dataset.gm;
    $id("punkteSection").style.display = activeGmTab === "punkte" ? "" : "none";
    $id("rundenSection").style.display = activeGmTab === "runden" ? "" : "none";
  });
});

/* ═══════════════════════════════════════════════════════════════
   SETUP SCREEN — Open
═══════════════════════════════════════════════════════════════ */
function openSetup(mode) {
  currentMode = String(mode);
  const cfg   = CONFIG[currentMode];

  setupSubtitle.textContent =
    currentMode === "4"
      ? "Gebt den 2 Teams ihre Namen und wählt den Spielmodus."
      : "Gebt den 3 Spielern ihre Namen und wählt den Spielmodus.";

  nameInputGrid.innerHTML = cfg.names.map((name, i) => `
    <div class="name-card" style="animation-delay:${i * 75}ms">
      <div class="name-num">${i + 1}</div>
      <div class="name-field">
        <label class="name-lbl" for="ni${i}">${escapeHtml(cfg.entityLabel)} ${i + 1}</label>
        <input type="text" id="ni${i}" class="name-input"
          value="${escapeHtml(name)}" placeholder="${escapeHtml(name)}"
          maxlength="22" autocomplete="off" />
      </div>
    </div>`).join("");

  // Reset gm-tabs to "punkte"
  activeGmTab = "punkte";
  document.querySelectorAll(".gm-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.gm === "punkte");
  });
  $id("punkteSection").style.display = "";
  $id("rundenSection").style.display = "none";

  showScreen("setup");

  setTimeout(() => {
    const first = $id("ni0");
    if (first) { first.focus(); first.select(); }
  }, 220);
}

/* ═══════════════════════════════════════════════════════════════
   BEGIN GAME
═══════════════════════════════════════════════════════════════ */
function beginGame() {
  const cfg = CONFIG[currentMode];

  // Collect names
  activeNames = cfg.names.map((def, i) => {
    const v = $id(`ni${i}`)?.value.trim();
    return v || def;
  });

  // Collect game mode settings
  gameMode   = activeGmTab;
  zielPunkte = Math.max(100, sanitizeNumber($id("zielPunkteInput").value) || 1000);
  maxRunden  = Math.max(2,   sanitizeNumber($id("maxRundenInput").value)  || 10);

  // Reset state
  gesamt       = Array(activeNames.length).fill(0);
  runde        = 1;
  roundHistory = [];

  // Build UI
  buildScoreTable();
  buildActorSelect();
  resetInputs();
  clearValidationError();
  updateRoundBadge();
  updateUndoState();

  // Labels
  gameTitle.textContent    = `Wertung – ${cfg.title}`;
  gameSubtitle.textContent = cfg.subtitle;
  macherLabel.textContent  = cfg.actorLabel;
  $id("entityHeader").textContent = cfg.entityLabel;

  // Progress column visibility
  const isRunden = gameMode === "runden";
  scoreTable.classList.toggle("runden-mode", isRunden);
  progressTh.style.display = isRunden ? "none" : "";

  // Clear history
  clearHistoryUI();
  hideWinnerModal();
  clearSave();

  showScreen("game");
}

/* ═══════════════════════════════════════════════════════════════
   SCORE TABLE
═══════════════════════════════════════════════════════════════ */
function buildScoreTable() {
  scoreTableBody.innerHTML = activeNames.map((name, i) => `
    <tr>
      <td class="entity-name">${escapeHtml(name)}</td>
      <td><input type="number" class="meldung"   data-index="${i}" value="0" tabindex="${3 + i}" /></td>
      <td><input type="number" class="gestochen" data-index="${i}" value="0" tabindex="${3 + activeNames.length + i}" /></td>
      <td class="total-cell gesamt${i}" tabindex="-1">0</td>
      <td class="progress-td progress-td${i}" ${gameMode === "runden" ? 'style="display:none"' : ""}>
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill pf${i}" style="width:0%"></div>
          </div>
          <span class="progress-pct ppct${i}">0%</span>
        </div>
      </td>
    </tr>`).join("");
}

function buildActorSelect() {
  spielerIndexSelect.innerHTML = activeNames
    .map((name, i) => `<option value="${i}">${escapeHtml(name)}</option>`)
    .join("");
}

function resetInputs() {
  reizwertInput.value = 0;
  document.querySelectorAll(".meldung, .gestochen").forEach(el => { el.value = 0; });
  spielerIndexSelect.selectedIndex = 0;
  updateTotals();
}

function updateTotals(prevGesamt) {
  gesamt.forEach((wert, i) => {
    const cell = document.querySelector(`.gesamt${i}`);
    if (!cell) return;
    if (prevGesamt !== undefined) {
      animateCounter(cell, prevGesamt[i], wert);
    } else {
      cell.textContent = wert;
    }
    cell.classList.toggle("is-negative", wert < 0);
    updateProgressBar(i, wert);
  });
}

function updateProgressBar(i, wert) {
  if (gameMode === "runden") return;
  const fill = document.querySelector(`.pf${i}`);
  const pct  = document.querySelector(`.ppct${i}`);
  if (!fill || !pct) return;
  const ratio  = zielPunkte > 0 ? Math.max(0, Math.min(1, wert / zielPunkte)) : 0;
  const pctVal = Math.round(ratio * 100);
  fill.style.width = `${pctVal}%`;
  fill.classList.toggle("neg", wert < 0);
  pct.textContent  = `${pctVal}%`;
}

function updateRoundBadge() {
  roundBadge.textContent =
    gameMode === "runden"
      ? `Runde ${runde} / ${maxRunden}`
      : `Runde ${runde}`;
  // Pulse animation
  roundBadge.style.animation = "none";
  void roundBadge.offsetWidth;
  roundBadge.style.animation = "";
}

function updateUndoState() {
  undoBtn.disabled = roundHistory.length === 0;
}

function getRoundValues() {
  const meldNodes  = document.querySelectorAll(".meldung");
  const stichNodes = document.querySelectorAll(".gestochen");
  const meld  = [];
  const stich = [];
  for (let i = 0; i < activeNames.length; i++) {
    meld.push(sanitizeNumber(meldNodes[i]?.value));
    stich.push(sanitizeNumber(stichNodes[i]?.value));
  }
  return { meld, stich };
}

/* ═══════════════════════════════════════════════════════════════
   GAME LOGIC — exakt erhalten
═══════════════════════════════════════════════════════════════ */
function calculateRound({ meld, stich, reizwert, actorIndex }) {
  const count        = activeNames.length;
  const rundenpunkte = Array(count).fill(0);
  const spielerSumme = meld[actorIndex] + stich[actorIndex];

  if (meld[actorIndex] === -reizwert) {
    rundenpunkte[actorIndex] = -reizwert;
    for (let i = 0; i < count; i++) {
      if (i !== actorIndex) rundenpunkte[i] = meld[i] + Math.floor(reizwert / 2);
    }
  } else if (spielerSumme >= reizwert) {
    rundenpunkte[actorIndex] = spielerSumme;
    for (let i = 0; i < count; i++) {
      if (i !== actorIndex) rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
    }
  } else {
    rundenpunkte[actorIndex] = -reizwert * 2;
    for (let i = 0; i < count; i++) {
      if (i !== actorIndex) rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
    }
  }

  return rundenpunkte;
}

function getResult(meld, stich, reizwert, actorIndex) {
  if (meld[actorIndex] === -reizwert) return "bettel";
  if (meld[actorIndex] + stich[actorIndex] >= reizwert) return "won";
  return "lost";
}

/* ═══════════════════════════════════════════════════════════════
   HISTORY — Accordion
═══════════════════════════════════════════════════════════════ */
function clearHistoryUI() {
  while (historyList.firstChild) historyList.removeChild(historyList.firstChild);
  historyList.appendChild(historyEmpty);
  historyEmpty.style.display = "";
}

function createHistoryItem(data, roundNum) {
  const { meld, stich, reizwert, actorIndex, rundenpunkte, result } = data;

  historyEmpty.style.display = "none";

  const resultLabels = { won:"Gewonnen", lost:"Verloren", bettel:"Bettel" };
  const chipsHTML = rundenpunkte.map((pts, i) => {
    const cls = pts > 0 ? "pos" : pts < 0 ? "neg" : "";
    const sign = pts > 0 ? "+" : "";
    return `<span class="h-chip ${cls}">${escapeHtml(activeNames[i])}: ${sign}${pts}</span>`;
  }).join("");

  const detailRows = [
    { label:"Gemeldet",   vals: meld },
    { label:"Gestochen",  vals: stich },
    { label:"Punkte",     vals: rundenpunkte, showSign: true },
  ];

  const detailHTML = detailRows.map(row => `
    <tr>
      <td>${row.label}</td>
      ${row.vals.map(v => {
        if (!row.showSign) return `<td>${v}</td>`;
        const cls  = v > 0 ? "h-pts-pos" : v < 0 ? "h-pts-neg" : "";
        const sign = v > 0 ? "+" : "";
        return `<td class="${cls}">${sign}${v}</td>`;
      }).join("")}
      <td>${row.label === "Gemeldet" ? reizwert : "—"}</td>
    </tr>`).join("");

  const colHeaders = activeNames.map(n => `<th>${escapeHtml(n)}</th>`).join("");

  const item = document.createElement("div");
  item.className = `h-item${result === "won" ? " winner-item" : ""}`;
  item.innerHTML = `
    <button class="h-item-hd" aria-expanded="false">
      <span class="h-round-lbl">Runde ${roundNum}</span>
      <span class="h-actor">↑ ${escapeHtml(activeNames[actorIndex])} · RW ${reizwert}</span>
      <span class="h-result ${result}">${resultLabels[result]}</span>
      <div class="h-chips">${chipsHTML}</div>
      <span class="h-toggle">▼</span>
    </button>
    <div class="h-item-body">
      <table class="h-detail">
        <thead>
          <tr><th></th>${colHeaders}<th>Reizwert</th></tr>
        </thead>
        <tbody>${detailHTML}</tbody>
      </table>
    </div>`;

  item.querySelector(".h-item-hd").addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    item.classList.toggle("open", !isOpen);
    item.querySelector(".h-item-hd").setAttribute("aria-expanded", String(!isOpen));
  });

  historyList.appendChild(item);

  // Auto-scroll to bottom
  historyList.scrollTop = historyList.scrollHeight;

  return item;
}

/* ═══════════════════════════════════════════════════════════════
   WIN / END CONDITIONS
═══════════════════════════════════════════════════════════════ */
function checkEndCondition(actorIndex, rundenpunkte) {
  if (gameMode === "punkte") {
    // Win: actor reaches or exceeds zielPunkte with a positive round
    if (gesamt[actorIndex] >= zielPunkte && rundenpunkte[actorIndex] > 0) {
      return { ended: true, winner: actorIndex };
    }
  } else {
    // Runden mode: game ends after maxRunden
    if (runde >= maxRunden) {
      const maxScore = Math.max(...gesamt);
      const winner   = gesamt.findIndex(s => s === maxScore);
      return { ended: true, winner };
    }
  }
  return { ended: false };
}

function showWinnerModal(winnerIndex) {
  const name   = activeNames[winnerIndex];
  const punkte = gesamt[winnerIndex];

  if (gameMode === "punkte") {
    winnerTitle.textContent = `${name} hat gewonnen!`;
    winnerText.textContent  =
      `${name} hat ${zielPunkte} Punkte erreicht! Endstand: ${punkte} Punkte.`;
  } else {
    // Show full standings for runden mode
    const standings = gesamt
      .map((s, i) => ({ name: activeNames[i], score: s }))
      .sort((a, b) => b.score - a.score)
      .map((p, i) => `${i + 1}. ${p.name}: ${p.score} Pkt.`)
      .join(" · ");
    winnerTitle.textContent = `Spiel beendet! ${name} gewinnt!`;
    winnerText.textContent  = `Nach ${maxRunden} Runden · Endstand: ${standings}`;
  }

  winnerModal.classList.remove("hidden");
  winnerModal.setAttribute("aria-hidden", "false");
  launchConfetti();
  clearSave();
}

function hideWinnerModal() {
  winnerModal.classList.add("hidden");
  winnerModal.setAttribute("aria-hidden", "true");
  confettiLayer.innerHTML = "";
}

function launchConfetti() {
  confettiLayer.innerHTML = "";
  const colors = ["#d4a830","#e05050","#4ecdc4","#5b8def","#9b5de5","#3aa76d","#ff8c42"];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("span");
    p.className = "confetti";
    p.style.left             = `${Math.random() * 100}%`;
    p.style.background       = colors[i % colors.length];
    p.style.animationDuration = `${2.0 + Math.random() * 2.2}s`;
    p.style.animationDelay   = `${Math.random() * 0.45}s`;
    p.style.transform        = `rotate(${Math.random() * 260}deg)`;
    p.style.width            = `${8 + Math.random() * 6}px`;
    confettiLayer.appendChild(p);
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
  clearHistoryUI();
  buildScoreTable();
  buildActorSelect();
  resetInputs();
  clearValidationError();
  updateRoundBadge();
  updateUndoState();
  hideWinnerModal();
  clearSave();
}

function undoLastRound() {
  if (roundHistory.length === 0) return;
  hideWinnerModal();

  const last       = roundHistory.pop();
  const prevGesamt = [...gesamt];
  gesamt = gesamt.map((w, i) => w - last.rundenpunkte[i]);
  updateTotals(prevGesamt);

  if (last.historyEl?.parentNode) last.historyEl.remove();
  if (historyList.children.length === 0 ||
      (historyList.children.length === 1 && historyList.children[0] !== historyEmpty)) {
    // nothing
  }
  if (roundHistory.length === 0) {
    historyList.appendChild(historyEmpty);
    historyEmpty.style.display = "";
  }

  reizwertInput.value      = last.reizwert;
  spielerIndexSelect.value = String(last.actorIndex);
  document.querySelectorAll(".meldung").forEach((el, i) => { el.value = last.meld[i] ?? 0; });
  document.querySelectorAll(".gestochen").forEach((el, i) => { el.value = last.stich[i] ?? 0; });

  runde = Math.max(1, runde - 1);
  updateRoundBadge();
  updateUndoState();
  saveGame();

  showToast(`↶ Runde ${runde} rückgängig gemacht`);
}

/* ═══════════════════════════════════════════════════════════════
   REGELÜBERSICHT
═══════════════════════════════════════════════════════════════ */
function openRegelModal() {
  regelModal.classList.remove("hidden");
  regelModal.setAttribute("aria-hidden", "false");
}
function closeRegelModal() {
  regelModal.classList.add("hidden");
  regelModal.setAttribute("aria-hidden", "true");
}

regelBtn.addEventListener("click", openRegelModal);
document.querySelectorAll(".js-close-regel").forEach(btn =>
  btn.addEventListener("click", closeRegelModal));
regelModal.addEventListener("click", e => {
  if (e.target.classList.contains("modal-backdrop")) closeRegelModal();
});

/* ═══════════════════════════════════════════════════════════════
   MELDUNGSRECHNER
═══════════════════════════════════════════════════════════════ */
function initMeldCounts() {
  meldCounts = {};
  MELDUNGEN_DATA.forEach(cat => cat.items.forEach(item => { meldCounts[item.id] = 0; }));
}

function getMeldTotal() {
  return MELDUNGEN_DATA.flatMap(c => c.items)
    .reduce((sum, item) => sum + (meldCounts[item.id] || 0) * item.punkte, 0);
}

function refreshMeldTotal() {
  meldTotal.textContent = getMeldTotal();
}

function buildMeldBody() {
  meldBody.innerHTML = MELDUNGEN_DATA.map(cat => `
    <div>
      <div class="meld-cat-label">${escapeHtml(cat.category)}</div>
      ${cat.items.map(item => `
        <div class="meld-item" data-id="${item.id}">
          <div class="meld-item-info">
            <div class="meld-item-name">${escapeHtml(item.name)}</div>
            <div class="meld-item-desc">${escapeHtml(item.desc)}</div>
          </div>
          <div class="meld-item-pts">${item.punkte} Pkt.</div>
          <div class="meld-counter">
            <button class="meld-cnt-btn dec-btn" data-id="${item.id}"
              ${meldCounts[item.id] <= 0 ? "disabled" : ""}>−</button>
            <span class="meld-cnt-val cnt-${item.id}">${meldCounts[item.id]}</span>
            <button class="meld-cnt-btn inc-btn" data-id="${item.id}"
              ${meldCounts[item.id] >= item.max ? "disabled" : ""}>+</button>
          </div>
        </div>`).join("")}
    </div>`).join("");

  // Bind counter buttons
  meldBody.querySelectorAll(".inc-btn").forEach(btn => {
    btn.addEventListener("click", () => changeMeldCount(btn.dataset.id, 1));
  });
  meldBody.querySelectorAll(".dec-btn").forEach(btn => {
    btn.addEventListener("click", () => changeMeldCount(btn.dataset.id, -1));
  });
}

function changeMeldCount(id, delta) {
  const item = MELDUNGEN_DATA.flatMap(c => c.items).find(i => i.id === id);
  if (!item) return;
  meldCounts[id] = Math.max(0, Math.min(item.max, (meldCounts[id] || 0) + delta));
  // Update the display
  const valEl = meldBody.querySelector(`.cnt-${id}`);
  if (valEl) valEl.textContent = meldCounts[id];
  // Update button disabled states
  meldBody.querySelectorAll(`.dec-btn[data-id="${id}"]`).forEach(b => {
    b.disabled = meldCounts[id] <= 0;
  });
  meldBody.querySelectorAll(`.inc-btn[data-id="${id}"]`).forEach(b => {
    b.disabled = meldCounts[id] >= item.max;
  });
  refreshMeldTotal();
}

function openMeldungsrechner() {
  // Update "Übernehmen für" label with current selected macher
  const idx = sanitizeNumber(spielerIndexSelect.value);
  meldApplyName.textContent = activeNames[idx] || "—";

  initMeldCounts();
  buildMeldBody();
  refreshMeldTotal();

  meldModal.classList.remove("hidden");
  meldModal.setAttribute("aria-hidden", "false");
}

function closeMeldModal() {
  meldModal.classList.add("hidden");
  meldModal.setAttribute("aria-hidden", "true");
}

meldungsBtn.addEventListener("click", openMeldungsrechner);

document.querySelectorAll(".js-close-meld").forEach(btn =>
  btn.addEventListener("click", closeMeldModal));
meldModal.addEventListener("click", e => {
  if (e.target.classList.contains("modal-backdrop")) closeMeldModal();
});

meldResetBtn.addEventListener("click", () => {
  initMeldCounts();
  buildMeldBody();
  refreshMeldTotal();
});

meldApplyBtn.addEventListener("click", () => {
  const idx   = sanitizeNumber(spielerIndexSelect.value);
  const total = getMeldTotal();
  const meldInputs = document.querySelectorAll(".meldung");
  if (meldInputs[idx]) {
    meldInputs[idx].value = total;
    closeMeldModal();
    showToast(`🧮 ${total} Punkte für ${activeNames[idx]} übernommen`);
  }
});

// Sync "Übernehmen für" label when macher changes
spielerIndexSelect.addEventListener("change", () => {
  const idx = sanitizeNumber(spielerIndexSelect.value);
  meldApplyName.textContent = activeNames[idx] || "—";
});

/* ═══════════════════════════════════════════════════════════════
   LOCAL STORAGE — Spielstand-Persistenz
═══════════════════════════════════════════════════════════════ */
function saveGame() {
  if (!currentMode || roundHistory.length === 0) return;
  const state = {
    v:           3,
    currentMode,
    gameMode,
    zielPunkte,
    maxRunden,
    activeNames: [...activeNames],
    gesamt:      [...gesamt],
    runde,
    history: roundHistory.map(r => ({
      reizwert:    r.reizwert,
      actorIndex:  r.actorIndex,
      meld:        [...r.meld],
      stich:       [...r.stich],
      rundenpunkte:[...r.rundenpunkte],
      result:      r.result,
    })),
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

function loadSavedGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.v !== 3 || !s.currentMode || !s.activeNames) return null;
    return s;
  } catch { return null; }
}

function restoreGame(state) {
  currentMode  = state.currentMode;
  gameMode     = state.gameMode || "punkte";
  zielPunkte   = state.zielPunkte || 1000;
  maxRunden    = state.maxRunden  || 10;
  activeNames  = [...state.activeNames];
  gesamt       = [...state.gesamt];
  runde        = state.runde;
  roundHistory = [];

  const cfg = CONFIG[currentMode];
  gameTitle.textContent    = `Wertung – ${cfg.title}`;
  gameSubtitle.textContent = cfg.subtitle;
  macherLabel.textContent  = cfg.actorLabel;
  $id("entityHeader").textContent = cfg.entityLabel;

  const isRunden = gameMode === "runden";
  scoreTable.classList.toggle("runden-mode", isRunden);
  progressTh.style.display = isRunden ? "none" : "";

  buildScoreTable();
  buildActorSelect();
  updateTotals();
  clearHistoryUI();

  // Replay history items (DOM only, no re-calculation)
  state.history.forEach((data, idx) => {
    const el = createHistoryItem(data, idx + 1);
    roundHistory.push({ ...data, historyEl: el });
  });

  updateRoundBadge();
  updateUndoState();
  clearValidationError();
  hideWinnerModal();

  showScreen("game");
}

/* ═══════════════════════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════════════════════ */

// Mode cards → setup
document.querySelectorAll(".mode-card").forEach(btn => {
  btn.addEventListener("click", () => openSetup(btn.dataset.mode));
});

// Setup navigation
setupBackBtn.addEventListener("click", () => showScreen("start"));
startGameBtn.addEventListener("click", beginGame);

// Enter on setup → begin
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && setupScreen.classList.contains("active")) {
    e.preventDefault(); beginGame();
  }
});

// Enter on any game screen input → berechnen
gameScreen.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.tagName === "INPUT") {
    e.preventDefault(); berechnenBtn.click();
  }
});

// Back button
backBtn.addEventListener("click", () => {
  hideWinnerModal();
  showScreen("start");
});

// ── Calculate Round ────────────────────────────────────────────
berechnenBtn.addEventListener("click", () => {
  if (!currentMode) return;

  const reizwert   = sanitizeNumber(reizwertInput.value);
  const actorIndex = sanitizeNumber(spielerIndexSelect.value);

  // Validation
  if (reizwert <= 0) {
    showValidationError("⚠️ Bitte einen Reizwert größer als 0 eingeben.");
    reizwertInput.focus();
    return;
  }
  clearValidationError();

  const { meld, stich } = getRoundValues();
  const rundenpunkte    = calculateRound({ meld, stich, reizwert, actorIndex });
  const result          = getResult(meld, stich, reizwert, actorIndex);

  const prevGesamt = [...gesamt];
  gesamt = gesamt.map((w, i) => w + rundenpunkte[i]);
  updateTotals(prevGesamt);

  // Winner cell pulse
  const winnerCell = document.querySelector(`.gesamt${actorIndex}`);
  if (result === "won") {
    winnerCell?.classList.add("winner-highlight");
    setTimeout(() => winnerCell?.classList.remove("winner-highlight"), 3500);
  }

  // History item
  const historyEl = createHistoryItem(
    { meld, stich, reizwert, actorIndex, rundenpunkte, result },
    runde
  );

  const entry = { reizwert, actorIndex, meld:[...meld], stich:[...stich],
                  rundenpunkte:[...rundenpunkte], result, historyEl };
  roundHistory.push(entry);
  updateUndoState();

  // Check win / end
  const { ended, winner } = checkEndCondition(actorIndex, rundenpunkte);

  runde += 1;
  updateRoundBadge();
  saveGame();

  if (ended) {
    showWinnerModal(winner);
    return; // don't reset inputs so user can review
  }

  // Reset inputs for next round
  reizwertInput.value = 0;
  document.querySelectorAll(".meldung, .gestochen").forEach(el => { el.value = 0; });
  spielerIndexSelect.selectedIndex = 0;
  reizwertInput.focus();
});

// Undo / Reset
undoBtn.addEventListener("click", undoLastRound);
resetBtn.addEventListener("click", resetGame);

// Winner modal
winnerCloseBtn.addEventListener("click", hideWinnerModal);
winnerModal.addEventListener("click", e => {
  if (e.target.classList.contains("modal-backdrop")) hideWinnerModal();
});

// Restore modal
restoreYesBtn.addEventListener("click", () => {
  restoreModal.classList.add("hidden");
  const state = loadSavedGame();
  if (state) restoreGame(state);
});
restoreNoBtn.addEventListener("click", () => {
  restoreModal.classList.add("hidden");
  clearSave();
  showScreen("start");
});

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
(function init() {
  applyTheme(getStoredTheme(), false);
  initMeldCounts();

  // Check for saved game
  const saved = loadSavedGame();
  if (saved) {
    const modeLabel = saved.gameMode === "runden"
      ? `${saved.maxRunden} Runden`
      : `Punkteziel ${saved.zielPunkte}`;
    const names = (saved.activeNames || []).join(", ");
    restoreInfo.textContent =
      `${CONFIG[saved.currentMode]?.title || ""} · Runde ${saved.runde} · ${modeLabel}${names ? ` · ${names}` : ""}`;
    restoreModal.classList.remove("hidden");
    restoreModal.setAttribute("aria-hidden", "false");
  }
})();
