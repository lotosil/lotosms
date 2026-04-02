const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const db = require("./models");
const authRouter = require("./routes/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// API для регистрации/логина
app.use("/auth", authRouter);

let users = {};

// Socket.io
io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("join", async (username) => {
        const user = await db.User.findOne({ where: { username } });
        if (!user) return;

        users[socket.id] = username;

        // Отправляем последние 50 сообщений
        const messages = await db.Message.findAll({
            include: db.User,
            order: [["createdAt", "ASC"]],
            limit: 50
        });
        socket.emit("load messages", messages);

        io.emit("users", Object.values(users));
    });

    socket.on("chat message", async ({ user, text }) => {
        const dbUser = await db.User.findOne({ where: { username: user } });
        if (!dbUser) return;

        const msg = await db.Message.create({
            userId: dbUser.id,
            text,
            time: new Date().toLocaleTimeString()
        });

        io.emit("chat message", { ...msg.dataValues, User: dbUser });
    });

    socket.on("image", async ({ user, image }) => {
        const dbUser = await db.User.findOne({ where: { username: user } });
        if (!dbUser) return;

        const msg = await db.Message.create({
            userId: dbUser.id,
            image,
            time: new Date().toLocaleTimeString()
        });

        io.emit("image", { ...msg.dataValues, User: dbUser });
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("users", Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;

db.sequelize.sync().then(() => {
    server.listen(PORT, () => console.log("Server running on port " + PORT));
});