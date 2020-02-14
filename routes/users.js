const router = require("express").Router();
const bcrypt = require("bcryptjs");
const Sequelize = require("sequelize");
const validators = require("../helpers/validators");
const format = require("../helpers/format");
const User = require("../models/user");
const dia = require("../models/diagnosis");
const Diagnosis = dia.Diagnosis;
const Specialization = dia.DiagnosisSpecialization;
const PatientInfo = require("../models/patient_info");
const Op = Sequelize.Op;

/**
 * Checks whether a given email address has been used.
 * @param {string} email The email address to check
 * @returns {Promise<Boolean>}
 */
async function isEmailUsed(email) {
    let user = await User.findOne({ where: { email } });
    if (user) {
        return true;
    }
    return false;
}

/**
 * Validates user details
 * @param {Request} req The client request object
 * @param {Response} res The server response object
 * @returns {Boolean}
 */
function validateUser(req, res) {
    const body = req.body;
    if (!body.email || !validators.isEmail(body.email)) {
        return res.status(422).json({ email: 'Provide a valid email address' });
    }
    if (!body.name || !validators.isValidName(body.name)) {
        return res.status(422).json({ name: 'Provide a valid name' });
    }
    if (!body.password) {
        return res.status(422).json({ password: 'Provide a valid password' });
    }
    return true;
}

/**
 * Formats user data.
 * @param {{email: string, name: string}} data The user data to format
 * @returns {{email: string, name: string}}
 */
function formatUser(data) {
    data.email = data.email.toLowerCase();
    data.name = format.titlecase(data.name);
    return data;
}

router.post('/users', async (req, res) => {
    if (validateUser(req, res) !== true) {
        return;
    }
    const body = req.body;
    try {
        const emailUsed = await isEmailUsed(body.email);
        if (emailUsed) {
            return res.status(409).json({ email: 'Email address has already been used.' });
        }
        const password = bcrypt.hashSync(body.password, 12);
        const data = formatUser(body);
        await User.create({
            email: data.email,
            name: data.name,
            password
        });
        return res.status(201).json(body);
    } catch (error) {
        console.log(error);
        return res.status(500).json();
    }
});

router.put('/users', async (req, res) => {
    if (validateUser(req, res) !== true) {
        return;
    }
    const body = req.body;
    try {
        const password = bcrypt.hashSync(body.password, 12);
        const data = formatUser(body);
        await User.update({ name: data.name, password }, { where: { email: data.email } });
        return res.status(202).json(body);
    } catch (error) {
        return res.status(500).json();
    }
});

router.get('/users/history', async (req, res) => {
    const email = req.user.email;
    const startDate = req.query.startDate + ' 00:00:01';
    const endDate = req.query.endDate;
    try {
        const data = [];
        let patients = await PatientInfo.findAll({ where: { initiator: email, createdAt: { [Op.gte]: startDate, [Op.lte]: endDate } } });
        if (!patients) {
            return res.status(200).json([]);
        }
        for (let patient of patients) {
            let value = patient.dataValues;
            let item = {};
            let diagnosis = await Diagnosis.findOne({ where: { ID: value.diagnosis } });
            if (!diagnosis) {
                continue;
            }
            item.Issue = diagnosis;
            item.Specialisation = await Specialization.findAll({ where: { diagnosis: value.diagnosis } });
            data.push(item);
        }
        return res.status(200).json(data);
    } catch (error) {
       return res.status(500).json();
    }
});

module.exports = router;