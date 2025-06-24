// Genera un userId casuale (simulazione autenticazione)
const userId = 'user_' + Math.random().toString(36).substr(2, 9);

// WebSocket
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => console.log('Connesso al WebSocket');
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    addMessageToWall(message);
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
            ws.send(JSON.stringify({ text, userId }));
            messageInput.value = '';
            wordCount.textContent = '0/5 parole';
            sendButton.disabled = true;
        }
    });
}

// Carica messaggi iniziali
function loadMessages() {
    fetch('/messages')
        .then(res => res.json())
        .then(messages => messages.forEach(addMessageToWall));
}

// Aggiungi messaggio al muro
function addMessageToWall(message) {
    const wall = document.getElementById('wall');
    if (!wall) return;
    const tile = document.createElement('div');
    tile.className = 'message-tile';
    tile.innerHTML = `
        <p>${message.text}</p>
        <button class="vote-button" data-id="${message._id}">Sospetto?</button>
    `;
    wall.prepend(tile);
    tile.querySelector('.vote-button').addEventListener('click', () => voteMessage(message._id));
}

// Gestione voto
function voteMessage(messageId) {
    fetch('/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, userId })
    })
        .then(res => res.text())
        .then(text => {
            alert(text);
            document.querySelector(`button[data-id="${messageId}"]`).disabled = true;
        });
}

// Carica statistiche
function loadStats() {
    const votesReceived = document.getElementById('votesReceived');
    const lastVote = document.getElementById('lastVote');
    if (!votesReceived || !lastVote) return;
    fetch(`/user/${userId}`)
        .then(res => res.json())
        .then(data => {
            votesReceived.textContent = `Hai ricevuto ${data.votesReceived} voti questa settimana`;
            lastVote.textContent = data.lastVote
                ? `Hai votato l'infiltrato ieri!`
                : `Hai mancato l'infiltrato`;
        });
}

// Inizializzazione
if (document.getElementById('wall')) loadMessages();
if (document.getElementById('votesReceived')) loadStats();