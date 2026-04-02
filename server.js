const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let messages = [];
let users = {};
let messageId = 0;

io.on("connection", (socket) => {
    console.log("User connected");

    socket.emit("load messages", messages);

    // вход
    socket.on("join", (username) => {
        users[socket.id] = username;
        io.emit("users", Object.values(users));
    });

    // сообщение
    socket.on("chat message", ({ user, text }) => {
        const msg = {
            id: messageId++,
            user,
            text,
            time: new Date().toLocaleTimeString(),
            delivered: [],
            read: []
        };

        messages.push(msg);
        io.emit("chat message", msg);
    });

    // фото
    socket.on("image", ({ user, image }) => {
        const msg = {
            id: messageId++,
            user,
            image,
            time: new Date().toLocaleTimeString(),
            delivered: [],
            read: []
        };

        messages.push(msg);
        io.emit("image", msg);
    });

    // доставлено
    socket.on("delivered", ({ id, user }) => {
        const msg = messages.find(m => m.id === id);
        if (msg && !msg.delivered.includes(user)) {
            msg.delivered.push(user);
        }
    });

    // прочитано
    socket.on("read", ({ id, user }) => {
        const msg = messages.find(m => m.id === id);
        if (msg && !msg.read.includes(user)) {
            msg.read.push(user);
        }

        io.emit("message read", msg);
    });

    // печатает
    socket.on("typing", (username) => {
        socket.broadcast.emit("typing", username);
    });

    socket.on("stop typing", () => {
        socket.broadcast.emit("stop typing");
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("users", Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running");
});