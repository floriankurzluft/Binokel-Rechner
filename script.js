const berechnenBtn = document.getElementById("berechnenBtn");
const reizwertInput = document.getElementById("reizwert");
const spielerIndexSelect = document.getElementById("spielerIndex");

let gesamt = [0,0,0];

berechnenBtn.addEventListener("click", () => {
    const reizwert = parseInt(reizwertInput.value) || 0;
    const spielerIndex = parseInt(spielerIndexSelect.value);

    const meldungInputs = document.querySelectorAll(".meldung");
    const gestochenInputs = document.querySelectorAll(".gestochen");

    let meldungen = [];
    let gestochen = [];
    for(let i=0;i<3;i++){
        meldungen.push(parseInt(meldungInputs[i].value)||0);
        gestochen.push(parseInt(gestochenInputs[i].value)||0);
    }

    let rundenpunkte = [0,0,0];

    // Spieler der das Spiel macht
    let sMeld = meldungen[spielerIndex];
    let sStich = gestochen[spielerIndex];
    let sSum = sMeld + sStich;

    if(sMeld === -reizwert){
        // Spiel abgelassen
        rundenpunkte[spielerIndex] = -reizwert;
        for(let i=0;i<3;i++){
            if(i!==spielerIndex){
                rundenpunkte[i] = meldungen[i] + Math.floor(reizwert/2);
            }
        }
    } else if(sSum >= reizwert){
        rundenpunkte[spielerIndex] = sSum;
        for(let i=0;i<3;i++){
            if(i!==spielerIndex){
                rundenpunkte[i] = gestochen[i] === 0 ? 0 : meldungen[i] + gestochen[i];
            }
        }
    } else {
        rundenpunkte[spielerIndex] = -reizwert*2;
        for(let i=0;i<3;i++){
            if(i!==spielerIndex){
                rundenpunkte[i] = gestochen[i] === 0 ? 0 : meldungen[i] + gestochen[i];
            }
        }
    }

    // Gesamtpunkte aktualisieren
    for(let i=0;i<3;i++){
        gesamt[i] += rundenpunkte[i];
        document.querySelector(`.runde${i+1}`).innerText = rundenpunkte[i];
        document.querySelector(`.gesamt${i+1}`).innerText = gesamt[i];
    }

    // Gewinner prüfen
    let winnerText = "";
    for(let i=0;i<3;i++){
        if(gesamt[i]>=1000 && i===spielerIndex && rundenpunkte[i]>0){
            winnerText = `🎉 Spieler ${i+1} hat gewonnen! 🎉`;
            break;
        }
    }
    document.getElementById("winner").innerText = winnerText;
});
