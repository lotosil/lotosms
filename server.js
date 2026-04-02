const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  avatar: DataTypes.STRING
});

const Message = sequelize.define('Message', {
  text: DataTypes.TEXT,
  image: DataTypes.STRING,
  delivered: { type: DataTypes.JSON, defaultValue: [] },
  read: { type: DataTypes.JSON, defaultValue: [] },
  time: DataTypes.STRING
});

User.hasMany(Message);
Message.belongsTo(User);

(async () => { await sequelize.sync(); })();

app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/avatars'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post('/register', upload.single('avatar'), async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const avatar = req.file ? '/public/avatars/' + req.file.filename : null;
  try {
    const user = await User.create({ username, password: hashed, avatar });
    res.json({ success: true, userId: user.id, avatar });
  } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.json({ success: false, error: 'No user' });
  const match = await bcrypt.compare(password, user.password);
  res.json({ success: match, userId: user.id, avatar: user.avatar });
});

let messages = [];
let users = {};
let messageId = 0;

io.on('connection', socket => {
  socket.emit('load messages', messages);

  socket.on('join', username => { users[socket.id] = username; io.emit('users', Object.values(users)); });
  socket.on('chat message', ({ user, text }) => { const msg = { id: messageId++, user, text, time: new Date().toLocaleTimeString(), delivered: [], read: [] }; messages.push(msg); io.emit('chat message', msg); });
  socket.on('image', ({ user, image }) => { const msg = { id: messageId++, user, image, time: new Date()


eString(), delivered: [], read: [] }; messages.push(msg); io.emit('image', msg); });
  socket.on('delivered', ({ id, user }) => { const msg = messages.find(m => m.id === id); if (msg && !msg.delivered.includes(user)) msg.delivered.push(user); });
  socket.on('read', ({ id, user }) => { const msg = messages.find(m => m.id === id); if (msg && !msg.read.includes(user)) msg.read.push(user); io.emit('message read', msg); });
  socket.on('typing', username => socket.broadcast.emit('typing', username));
  socket.on('stop typing', () => socket.broadcast.emit('stop typing'));
  socket.on('disconnect', () => { delete users[socket.id]; io.emit('users', Object.values(users)); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
