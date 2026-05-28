const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const modeButtons = document.querySelectorAll(".mode-card");
const backBtn = document.getElementById("backBtn");
const berechnenBtn = document.getElementById("berechnenBtn");
const resetBtn = document.getElementById("resetBtn");
const reizwertInput = document.getElementById("reizwert");
const spielerIndexSelect = document.getElementById("spielerIndex");
const macherLabel = document.getElementById("macherLabel");
const scoreTableBody = document.getElementById("scoreTableBody");
const historyHeaderRow = document.getElementById("historyHeaderRow");
const historyBody = document.getElementById("history");
const roundBadge = document.getElementById("roundBadge");
const gameTitle = document.getElementById("gameTitle");
const gameSubtitle = document.getElementById("gameSubtitle");
const winnerModal = document.getElementById("winnerModal");
const winnerTitle = document.getElementById("winnerTitle");
const winnerText = document.getElementById("winnerText");
const winnerCloseBtn = document.getElementById("winnerCloseBtn");
const confettiLayer = document.getElementById("confettiLayer");

const CONFIG = {
  3: {
    title: "3 Spieler",
    subtitle: "Einzelwertung für Spieler 1, Spieler 2 und Spieler 3",
    entityLabel: "Spieler",
    actorLabel: "Spieler macht das Spiel",
    names: ["Spieler 1", "Spieler 2", "Spieler 3"],
  },
  4: {
    title: "4 Spieler / 2 Teams",
    subtitle: "Teamwertung für Team 1 und Team 2 (2 gegen 2)",
    entityLabel: "Team",
    actorLabel: "Team macht das Spiel",
    names: ["Team 1", "Team 2"],
  }
};

let currentMode = null;
let gesamt = [];
let runde = 1;

function showScreen(screen) {
  startScreen.classList.toggle("active", screen === "start");
  gameScreen.classList.toggle("active", screen === "game");
}

function sanitizeNumber(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function startGame(mode) {
  currentMode = String(mode);
  gesamt = Array(CONFIG[currentMode].names.length).fill(0);
  runde = 1;

  buildScoreTable();
  buildActorSelect();
  buildHistoryHeader();
  resetInputs();
  updateRoundBadge();

  gameTitle.textContent = `Wertung – ${CONFIG[currentMode].title}`;
  gameSubtitle.textContent = CONFIG[currentMode].subtitle;
  macherLabel.textContent = CONFIG[currentMode].actorLabel;
  document.getElementById("entityHeader").textContent = CONFIG[currentMode].entityLabel;

  historyBody.innerHTML = "";
  hideWinnerModal();
  showScreen("game");
}

function buildScoreTable() {
  const names = CONFIG[currentMode].names;
  scoreTableBody.innerHTML = names.map((name, index) => `
    <tr>
      <td class="entity-name">${name}</td>
      <td><input type="number" class="meldung" data-index="${index}" value="0" /></td>
      <td><input type="number" class="gestochen" data-index="${index}" value="0" /></td>
      <td class="total-cell gesamt${index}">0</td>
    </tr>
  `).join("");
}

function buildActorSelect() {
  const names = CONFIG[currentMode].names;
  spielerIndexSelect.innerHTML = names
    .map((name, index) => `<option value="${index}">${name}</option>`)
    .join("");
}

function buildHistoryHeader() {
  const names = CONFIG[currentMode].names;
  historyHeaderRow.innerHTML = ["<th></th>", ...names.map(name => `<th>${name}</th>`), "<th>Reizwert</th>"].join("");
}

function resetInputs() {
  reizwertInput.value = 0;
  document.querySelectorAll(".meldung, .gestochen").forEach(input => {
    input.value = 0;
  });
  spielerIndexSelect.selectedIndex = 0;
  updateTotals();
}

function updateTotals() {
  gesamt.forEach((wert, index) => {
    const cell = document.querySelector(`.gesamt${index}`);
    if (cell) cell.textContent = wert;
  });
}

function updateRoundBadge() {
  roundBadge.textContent = `Runde ${runde}`;
}

function getRoundValues() {
  const count = CONFIG[currentMode].names.length;
  const meldungNodes = document.querySelectorAll(".meldung");
  const gestochenNodes = document.querySelectorAll(".gestochen");

  const meld = [];
  const stich = [];

  for (let i = 0; i < count; i += 1) {
    meld.push(sanitizeNumber(meldungNodes[i]?.value));
    stich.push(sanitizeNumber(gestochenNodes[i]?.value));
  }

  return { meld, stich };
}

function calculateRound({ meld, stich, reizwert, actorIndex }) {
  const count = CONFIG[currentMode].names.length;
  const rundenpunkte = Array(count).fill(0);
  const spielerSumme = meld[actorIndex] + stich[actorIndex];

  if (meld[actorIndex] === -reizwert) {
    rundenpunkte[actorIndex] = -reizwert;
    for (let i = 0; i < count; i += 1) {
      if (i !== actorIndex) {
        rundenpunkte[i] = meld[i] + Math.floor(reizwert / 2);
      }
    }
  } else if (spielerSumme >= reizwert) {
    rundenpunkte[actorIndex] = spielerSumme;
    for (let i = 0; i < count; i += 1) {
      if (i !== actorIndex) {
        rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
      }
    }
  } else {
    rundenpunkte[actorIndex] = -reizwert * 2;
    for (let i = 0; i < count; i += 1) {
      if (i !== actorIndex) {
        rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
      }
    }
  }

  return rundenpunkte;
}

function appendHistoryRows({ meld, stich, reizwert, actorIndex, rundenpunkte, winner }) {
  const rowMeld = document.createElement("tr");
  rowMeld.innerHTML = `
    <td class="runde-row-label">
      Runde ${runde}
      <span class="runde-sub">Gemeldet · ${CONFIG[currentMode].names[actorIndex]} macht das Spiel</span>
    </td>
    ${meld.map(value => `<td>${value}</td>`).join("")}
    <td>${reizwert}</td>
  `;

  const rowStich = document.createElement("tr");
  rowStich.innerHTML = `
    <td class="runde-row-label">
      Punkte
      <span class="runde-sub">Gestochen / gewertete Runde</span>
    </td>
    ${rundenpunkte.map((value, index) => `<td>${stich[index]} <span class="runde-sub">→ ${value}</span></td>`).join("")}
    <td>–</td>
  `;

  if (winner) {
    rowMeld.classList.add("winner-row");
    rowStich.classList.add("winner-row");
  }

  historyBody.appendChild(rowMeld);
  historyBody.appendChild(rowStich);
}

function showWinnerModal(name, punkte) {
  winnerTitle.textContent = `${name} hat gewonnen!`;
  winnerText.textContent = `${name} hat mindestens 1000 Punkte erreicht und das Spiel erfolgreich gemacht. Aktueller Stand: ${punkte} Punkte.`;
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
  const colors = ["#ff6b6b", "#ffd166", "#4ecdc4", "#5b8def", "#9b5de5", "#3aa76d"];

  for (let i = 0; i < 28; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${2.4 + Math.random() * 1.8}s`;
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.transform = `translateY(0) rotate(${Math.random() * 240}deg)`;
    confettiLayer.appendChild(piece);
  }
}

function resetGame() {
  if (!currentMode) return;
  gesamt = Array(CONFIG[currentMode].names.length).fill(0);
  runde = 1;
  historyBody.innerHTML = "";
  resetInputs();
  updateRoundBadge();
  hideWinnerModal();
}

modeButtons.forEach(button => {
  button.addEventListener("click", () => startGame(button.dataset.mode));
});

backBtn.addEventListener("click", () => {
  hideWinnerModal();
  showScreen("start");
});

berechnenBtn.addEventListener("click", () => {
  if (!currentMode) return;

  const reizwert = sanitizeNumber(reizwertInput.value);
  const actorIndex = sanitizeNumber(spielerIndexSelect.value);
  const { meld, stich } = getRoundValues();
  const rundenpunkte = calculateRound({ meld, stich, reizwert, actorIndex });

  gesamt = gesamt.map((wert, index) => wert + rundenpunkte[index]);
  updateTotals();

  const winner = gesamt[actorIndex] >= 1000 && rundenpunkte[actorIndex] > 0;
  appendHistoryRows({ meld, stich, reizwert, actorIndex, rundenpunkte, winner });

  if (winner) {
    const winnerCell = document.querySelector(`.gesamt${actorIndex}`);
    winnerCell?.classList.add("winner-highlight");
    setTimeout(() => winnerCell?.classList.remove("winner-highlight"), 4800);
    showWinnerModal(CONFIG[currentMode].names[actorIndex], gesamt[actorIndex]);
  }

  runde += 1;
  updateRoundBadge();
});

resetBtn.addEventListener("click", resetGame);
winnerCloseBtn.addEventListener("click", hideWinnerModal);

winnerModal.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal-backdrop")) {
    hideWinnerModal();
  }
});
