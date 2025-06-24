const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// Configurazione MongoDB
mongoose.connect('mongodb://localhost:27017/vocinelmuro', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connesso a MongoDB'))
    .catch(err => console.error('Errore MongoDB:', err));

// Schema MongoDB
const messageSchema = new mongoose.Schema({
    text: { type: String, required: true, maxlength: 50 },
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    votes: [{ type: String }] // Array di userId che hanno votato
});
const Message = mongoose.model('Message', messageSchema);

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    votesReceived: { type: Number, default: 0 },
    votesCast: [{ messageId: String, timestamp: Date }]
});
const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set per i client WebSocket
const clients = new Set();

// WebSocket
wss.on('connection', (ws) => {
    console.log('Nuovo client connesso');
    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            if (message.text && message.text.split(' ').length <= 5) {
                const savedMessage = await Message.create({
                    text: message.text,
                    userId: message.userId
                });
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(savedMessage));
                    }
                });
            }
        } catch (error) {
            console.error('Errore WebSocket:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnesso');
        clients.delete(ws);
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

// API REST
app.post('/message', async (req, res) => {
    const { text, userId } = req.body;
    if (!text || text.split(' ').length > 5) {
        return res.status(400).send('Messaggio non valido');
    }
    try {
        const message = await Message.create({ text, userId });
        res.status(201).send('Messaggio salvato');
    } catch (error) {
        res.status(500).send('Errore server');
    }
});

app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 }).limit(20);
        res.json(messages);
    } catch (error) {
        res.status(500).send('Errore server');
    }
});

app.post('/vote', async (req, res) => {
    const { messageId, userId } = req.body;
    try {
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).send('Messaggio non trovato');
        if (message.votes.includes(userId)) return res.status(400).send('Voto già registrato');
        message.votes.push(userId);
        await message.save();
        await User.updateOne(
            { userId: message.userId },
            { $inc: { votesReceived: 1 } },
            { upsert: true }
        );
        await User.updateOne(
            { userId },
            { $push: { votesCast: { messageId, timestamp: new Date() } } },
            { upsert: true }
        );
        res.send('Voto registrato');
    } catch (error) {
        res.status(500).send('Errore server');
    }
});

app.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.id });
        if (!user) return res.status(404).send('Utente non trovato');
        res.json({
            votesReceived: user.votesReceived,
            votesCast: user.votesCast.length,
            lastVote: user.votesCast.length > 0 ? user.votesCast[user.votesCast.length - 1].timestamp : null
        });
    } catch (error) {
        res.status(500).send('Errore server');
    }
});

// Avvio server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server avviato sulla porta ${PORT}`));
