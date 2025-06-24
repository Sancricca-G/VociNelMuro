// Genera un userId casuale
const userId = 'user_' + Math.random().toString(36).substr(2, 9);

// WebSocket
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => console.log('Connesso al WebSocket');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case 'initialMessages':
            data.messages.forEach(addMessageToWall);
            break;
        case 'newMessage':
            addMessageToWall(data.message);
            break;
        case 'voteUpdate':
            updateVoteButton(data.messageId, data.userId);
            break;
    }
};

// Gestione input messaggi
const messageInput = document.getElementById('messageInput');
const wordCount = document.getElementById('wordCount');
const sendButton = document.getElementById('sendButton');

if (messageInput) {
    messageInput.addEventListener('input', () => {
        const words = messageInput.value.trim().split(/\s+/).filter(w => w.length > 0);
        wordCount.textContent = `${words.length}/5 parole`;
        sendButton.disabled = words.length < 1 || words.length > 5;
    });

    sendButton.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (text.split(/\s+/).length <= 5) {
            ws.send(JSON.stringify({ type: 'newMessage', text, userId }));
            messageInput.value = '';
            wordCount.textContent = '0/5 parole';
            sendButton.disabled = true;
        }
    });
}

// Aggiungi messaggio al muro
function addMessageToWall(message) {
    const wall = document.getElementById('wall');
    if (!wall) return;
    const tile = document.createElement('div');
    tile.className = 'message-tile';
    tile.innerHTML = `
        <p>${message.text}</p>
        <button class="vote-button" data-id="${message.id}">Sospetto?</button>
    `;
    wall.prepend(tile);
    tile.querySelector('.vote-button').addEventListener('click', () => voteMessage(message.id));
}

// Gestione voto
function voteMessage(messageId) {
    ws.send(JSON.stringify({ type: 'vote', messageId, userId }));
}

// Aggiorna il pulsante di voto
function updateVoteButton(messageId, userId) {
    const button = document.querySelector(`.vote-button[data-id="${messageId}"]`);
    if (button && !button.disabled) {
        button.disabled = true;
        alert('Voto registrato');
    }
}

// Carica statistiche
function loadStats() {
    const votesReceived = document.getElementById('votesReceived');
    const lastVote = document.getElementById('lastVote');
    if (!votesReceived || !lastVote) return;
    // Simula dati in memoria (basati su users nel server)
    ws.send(JSON.stringify({ type: 'getStats', userId }));
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stats') {
            votesReceived.textContent = `Hai ricevuto ${data.votesReceived} voti questa settimana`;
            lastVote.textContent = data.lastVote ? 'Hai votato l’infiltrato ieri!' : 'Hai mancato l’infiltrato';
        }
    };
}

// Inizializzazione
if (document.getElementById('wall')) {
    // Nessun caricamento iniziale, gestito dal WebSocket
}
if (document.getElementById('votesReceived')) loadStats();