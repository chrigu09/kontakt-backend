require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());  // Damit Express JSON-Daten verarbeiten kann

// Verbindung zur MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB verbunden'))
.catch(err => console.error('MongoDB Fehler:', err));

// Mongoose Modell für Nachrichten
const Message = mongoose.model('Message', {
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});

// Nodemailer Transporter (E-Mail Service konfigurieren)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- HIER kommen die API-Routen ---

// POST Route für das Kontaktformular
app.post('/api/contact', async (req, res) => {
  try {
    const newMsg = new Message({
      name: req.body.name,
      email: req.body.email,
      message: req.body.nachricht  // Achte auf Feldnamen vom Frontend
    });
    await newMsg.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Neue Nachricht von ' + req.body.name,
      text: req.body.nachricht
    });

    res.send({ message: 'Nachricht gespeichert und E-Mail gesendet!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Fehler beim Verarbeiten' });
  }
});

// (Optional) Route zum Abrufen aller Nachrichten
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort({ date: -1 });
  res.json(messages);
});

// (Optional) Route zum Antworten per E-Mail
app.post('/api/reply', async (req, res) => {
  const { email, replyText } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Antwort auf deine Nachricht',
      text: replyText
    });
    res.send({ message: 'Antwort gesendet!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Fehler beim Senden der Antwort' });
  }
});

// Server starten
app.listen(process.env.PORT || 3000, () => {
  console.log('Server läuft auf Port', process.env.PORT || 3000);
});
