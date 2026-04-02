const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    // Хеширование пароля
    User.beforeCreate(async (user) => {
        const hash = await bcrypt.hash(user.password, 10);
        user.password = hash;
    });

    return User;
};