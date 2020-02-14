const Sequelize = require("sequelize");
const sequelize = require("../utils/mysql");
const Model = Sequelize.Model;

class Diagnosis extends Model {}

Diagnosis.init({
    ID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    Name: {
        type: Sequelize.STRING,
        allowNull: false
    } ,
    ProfName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Icd: {
        type: Sequelize.STRING,
        allowNull: false
    },
    IcdName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Accuracy: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    valid: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'diagnosis',
    indexes: [{ fields: ['Name' , 'Icd', 'Accuracy'] }]
});

class DiagnosisSpecialization extends Model {}
DiagnosisSpecialization.init({
    p_key: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    diagnosis: {
        type: Sequelize.INTEGER,
        references: {
            model: Diagnosis,
            key: 'ID'
        },
        unique: 'no_repeat'
    },
    ID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'no_repeat'
    },
    Name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    SpecialistID: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'diagnosis_specialization'
});

module.exports = {
    Diagnosis,
    DiagnosisSpecialization
};