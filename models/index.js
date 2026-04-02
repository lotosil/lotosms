const { Sequelize } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "../database.sqlite")
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./user")(sequelize, Sequelize);
db.Message = require("./message")(sequelize, Sequelize);

// Связь: сообщение принадлежит пользователю
db.User.hasMany(db.Message, { foreignKey: "userId" });
db.Message.belongsTo(db.User, { foreignKey: "userId" });

module.exports = db;