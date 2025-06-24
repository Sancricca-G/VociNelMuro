require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// --- Lettura variabili ambiente ---
const user = process.env.MONGO_USER;
const pass = encodeURIComponent(process.env.MONGO_PASS);
const cluster = process.env.MONGO_CLUSTER;
const dbName = process.env.MONGO_DB;

const uri = `mongodb+srv://${user}:${pass}@${cluster}/${dbName}?retryWrites=true&w=majority`;

// --- Connessione MongoDB ---
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Atlas connesso'))
    .catch(err => console.error('Errore connessione MongoDB:', err));

// --- Schemi e modelli ---

const userSchema = new mongoose.Schema({
    _id: String,
    votesMade: { type: Number, default: 0 },
    votesReceived: { type: Number, default: 0 },
});

const messageSchema = new mongoose.Schema({
    text: { type: String, required: true, maxlength: 100 },
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    votesReceived: { type: Number, default: 0 },
});

const voteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Message' },
    timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Vote = mongoose.model('Vote', voteSchema);

// --- API ---

app.post('/message', async (req, res) => {
    try {
        const { text, userId } = req.body;
        if (!text || !userId) {
            return res.status(400).json({ error: 'Testo e userId sono obbligatori' });
        }

        await User.findByIdAndUpdate(userId, {}, { upsert: true, new: true });

        const message = new Message({ text, userId });
        await message.save();

        res.status(201).json({ message: 'Messaggio salvato', id: message._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore interno server' });
    }
});

app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .limit(20)
            .select('text userId timestamp votesReceived')
            .exec();

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore interno server' });
    }
});

app.post('/vote', async (req, res) => {
    try {
        const { userId, messageId } = req.body;
        if (!userId || !messageId) {
            return res.status(400).json({ error: 'userId e messageId sono obbligatori' });
        }

        const existingVote = await Vote.findOne({ userId, messageId });
        if (existingVote) {
            return res.status(409).json({ error: 'Hai già votato questo messaggio' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Messaggio non trovato' });
        }

        const vote = new Vote({ userId, messageId });
        await vote.save();

        await User.findByIdAndUpdate(userId, { $inc: { votesMade: 1 } }, { upsert: true });
        await User.findByIdAndUpdate(message.userId, { $inc: { votesReceived: 1 } }, { upsert: true });

        message.votesReceived++;
        await message.save();

        res.json({ message: 'Voto registrato' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore interno server' });
    }
});

app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).exec();
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        res.json({
            userId,
            votesMade: user.votesMade,
            votesReceived: user.votesReceived,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore interno server' });
    }
});

// --- Avvio server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
