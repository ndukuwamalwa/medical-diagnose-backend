const Sequelize = require("sequelize");
const sequelize = require("../utils/mysql");
const Model = Sequelize.Model;
const Diagnosis = require("./diagnosis").Diagnosis;
const User = require("./user");

class PatientInfo extends Model {}

PatientInfo.init({
    year_of_birth: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'no_info_repeat'
    },
    gender: {
        type: Sequelize.ENUM('Male', 'Female'),
        allowNull: false,
        unique: 'no_info_repeat'
    },
    symptoms: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'no_info_repeat'
    },
    diagnosis: {
        type: Sequelize.INTEGER,
        references: {
            model: Diagnosis,
            key: 'ID'
        },
        unique: 'no_info_repeat'
    },
    initiator: {
        type: Sequelize.STRING,
        references: {
            model: User,
            key: 'email'
        }
    }
}, {
    sequelize,
    modelName: 'patient_info',
    indexes: [{ fields: ['symptoms'] }]
});

module.exports = PatientInfo;