const Sequelize = require("sequelize");
const sequelize = require("../utils/mysql");
const Model = Sequelize.Model;

class Symptom extends Model {}

Symptom.init({
    ID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    Name: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'symptom',
    indexes: [{ fields: ['Name'] }]
});

module.exports = Symptom;