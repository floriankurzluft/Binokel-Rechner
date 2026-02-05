const berechnenBtn = document.getElementById("berechnenBtn");
const reizwertInput = document.getElementById("reizwert");
const spielerIndexSelect = document.getElementById("spielerIndex");

let gesamt = [0,0,0];
berechnenBtn.addEventListener("click", () => {

    const reizwert = parseInt(reizwertInput.value) || 0;
    const spielerIndex = parseInt(spielerIndexSelect.value);

    const meldungInputs = document.querySelectorAll(".meldung");
    const gestochenInputs = document.querySelectorAll(".gestochen");

    let meld = [];
    let stich = [];

    for (let i = 0; i < 3; i++) {
        meld.push(parseInt(meldungInputs[i].value) || 0);
        stich.push(parseInt(gestochenInputs[i].value) || 0);
    }

    const table = document.getElementById("history");

    // Gemeldet-Zeile
    const rowMeld = document.createElement("tr");
    rowMeld.innerHTML = `
        <td class="label">Gemeldet</td>
        <td>${meld[0]}</td>
        <td>${meld[1]}</td>
        <td>${meld[2]}</td>
        <td>${reizwert}</td>
    `;

    // Gestochen-Zeile
    const rowStich = document.createElement("tr");
    rowStich.innerHTML = `
        <td class="label">Gestochen</td>
        <td>${stich[0]}</td>
        <td>${stich[1]}</td>
        <td>${stich[2]}</td>
        <td></td>
    `;

    table.appendChild(rowMeld);
    table.appendChild(rowStich);

    // Punkteberechnung
    let rundenpunkte = [0, 0, 0];
    let sSum = meld[spielerIndex] + stich[spielerIndex];

    if (meld[spielerIndex] === -reizwert) {
        rundenpunkte[spielerIndex] = -reizwert;
        for (let i = 0; i < 3; i++) {
            if (i !== spielerIndex) {
                rundenpunkte[i] = meld[i] + Math.floor(reizwert / 2);
            }
        }
    } else if (sSum >= reizwert) {
        rundenpunkte[spielerIndex] = sSum;
        for (let i = 0; i < 3; i++) {
            if (i !== spielerIndex) {
                rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
            }
        }
    } else {
        rundenpunkte[spielerIndex] = -reizwert * 2;
        for (let i = 0; i < 3; i++) {
            if (i !== spielerIndex) {
                rundenpunkte[i] = stich[i] === 0 ? 0 : meld[i] + stich[i];
            }
        }
    }

    for (let i = 0; i < 3; i++) {
        gesamt[i] += rundenpunkte[i];
        document.querySelector(`.gesamt${i + 1}`).innerText = gesamt[i];
    }

    // Gewinner prüfen
    for (let i = 0; i < 3; i++) {
        if (gesamt[i] >= 1000 && i === spielerIndex && rundenpunkte[i] > 0) {
            document.getElementById("resetBtn").style.display = "block";
        }
    }
    const resetBtn = document.getElementById("resetBtn");

    resetBtn.addEventListener("click", () => {
        // Gesamtpunkte zurücksetzen
        gesamt = [0, 0, 0];

        document.querySelector(".gesamt1").innerText = 0;
        document.querySelector(".gesamt2").innerText = 0;
        document.querySelector(".gesamt3").innerText = 0;

        // Rundenhistorie leeren
        document.getElementById("history").innerHTML = "";

        // Eingabefelder zurücksetzen
        document.querySelectorAll(".meldung").forEach(i => i.value = 0);
        document.querySelectorAll(".gestochen").forEach(i => i.value = 0);
        document.getElementById("reizwert").value = 0;

        // Button wieder ausblenden
        resetBtn.style.display = "none";
    })
});


