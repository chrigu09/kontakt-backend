
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

const Message = mongoose.model('Message', {
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/contact', async (req, res) => {
  const newMsg = new Message(req.body);
  await newMsg.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Neue Nachricht von ' + req.body.name,
    text: req.body.message
  });

  res.send('Nachricht gespeichert und E-Mail gesendet!');
});

app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort({ date: -1 });
  res.json(messages);
});

app.post('/api/reply', async (req, res) => {
  const { email, replyText } = req.body;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Antwort auf deine Nachricht',
    text: replyText
  });

  res.send('Antwort gesendet!');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server läuft auf Port', process.env.PORT || 3000);
});
