module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define("Message", {
        text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        delivered: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        read: {
            type: DataTypes.JSON,
            defaultValue: []
        },
        time: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    return Message;
};