function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const votes = randomInt(0, 15);
const votedInfiltrato = Math.random() < 0.5;

document.getElementById('votesMsg').textContent = `Hai ricevuto ${votes} voto${votes !== 1 ? 'i' : ''} questa settimana`;
const resultMsg = votedInfiltrato
    ? 'Hai votato l’infiltrato ieri!'
    : 'Hai mancato l’infiltrato';
const resultEl = document.getElementById('resultMsg');
resultEl.textContent = resultMsg;
if (votedInfiltrato) {
    resultEl.classList.add('highlight');
}