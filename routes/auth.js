const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const { User } = require("../models");

const router = express.Router();

// Настройка multer для аватаров
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/avatars"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });

// Регистрация
router.post("/register", upload.single("avatar"), async (req, res) => {
    try {
        const { username, password } = req.body;
        const avatar = req.file ? "/avatars/" + req.file.filename : null;
        const user = await User.create({ username, password, avatar });
        res.json({ success: true, user: { id: user.id, username, avatar } });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// Логин
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user) throw new Error("Пользователь не найден");

        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new Error("Неверный пароль");

        res.json({ success: true, user: { id: user.id, username: user.username, avatar: user.avatar } });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;