const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Dati in memoria
let messages = [];
let votes = {}; // { messageId: [userIds] }
let users = {}; // { userId: { votesReceived: number, votesCast: [messageId] } }

app.use(express.static(path.join(__dirname, 'public')));

// WebSocket
wss.on('connection', (ws) => {
    console.log('Nuovo client connesso');
    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    // Invia i messaggi esistenti al nuovo client
    ws.send(JSON.stringify({ type: 'initialMessages', messages }));

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'newMessage':
                    if (message.text && message.text.split(' ').length <= 5) {
                        const messageId = Date.now().toString(); // ID temporaneo
                        const newMessage = { id: messageId, text: message.text, userId: message.userId, timestamp: new Date() };
                        messages.unshift(newMessage); // Aggiungi in cima
                        messages = messages.slice(0, 20); // Limita a 20 messaggi
                        broadcast(JSON.stringify({ type: 'newMessage', message: newMessage }));
                    }
                    break;
                case 'vote':
                    const { messageId, userId } = message;
                    if (!votes[messageId]) votes[messageId] = [];
                    if (!votes[messageId].includes(userId)) {
                        votes[messageId].push(userId);
                        if (!users[userId]) users[userId] = { votesReceived: 0, votesCast: [] };
                        if (!users[message.userId]) users[message.userId] = { votesReceived: 0, votesCast: [] };
                        users[message.userId].votesReceived++;
                        users[userId].votesCast.push(messageId);
                        broadcast(JSON.stringify({ type: 'voteUpdate', messageId, userId }));
                    }
                    ws.send(JSON.stringify({ type: 'voteConfirmation', message: 'Voto registrato' }));
                    break;
            }
        } catch (error) {
            console.error('Errore WebSocket:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnesso');
    });
});

// Heartbeat per WebSocket
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// Funzione per broadcast
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Avvio server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server avviato sulla porta ${PORT}`));