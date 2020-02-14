const Sequelize = require("sequelize");
const sequelize = require("../utils/mysql");
const Model = Sequelize.Model;

class User extends Model {}

User.init({
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'user'
});

module.exports = User;