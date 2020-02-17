const crypto = require("crypto-js");
const router = require("express").Router();
const request = require("request");
const sequelize = require("../utils/mysql");
const diag = require("../models/diagnosis");
const Diagnosis = diag.Diagnosis;
const Specialisation = diag.DiagnosisSpecialization;
const PatientInfo = require("../models/patient_info");
const Symptoms = require("../models/symptom");

const auth_uri = process.env.PRIAID_auth_uri;
const api_uri = process.env.PRIAID_API_uri;
const secret = process.env.PRIAID_secret_key;
const computedHash = crypto.HmacMD5(auth_uri, secret);
const computedHashString = computedHash.toString(crypto.enc.Base64);

/**
 * Validates the given symptoms from the database
 * @param {number[]} symptoms numbers to check
 * @returns {Boolean}
 */
async function symptomsValid(symptoms) {
    for (let id of symptoms) {
        let symptom = await Symptoms.findOne({ where: { ID: id } });
        if (!symptom) {
            return false;
        }
    }
    return true;
}

/**
 * Checks whether a dignosis exists
 * @param {number} id Diagnosis id
 */
async function diagnosticExists(id) {
    const diagnosis = await Diagnosis.findOne({ where: { ID: id } });
    if (diagnosis) {
        return true;
    }
    return false;
}

/**
 * Requests diagnostics results from api and saves response in the database. Also sends to the client
 * @param {number} year Patient's year of birth
 * @param {string} gender Patient's gender
 * @param {string} symptomsString The patient's symptoms as a string delimited by a comma
 * @param {Response} res Server response object
 */
async function runDiagnostics(year, gender, symptomsString, req, res) {
    const symptoms = JSON.stringify(symptomsString.split(','));
    //Auhenticate
    request({
        uri: auth_uri,
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.PRIAID_api_key}:${computedHashString}`
        }
    }, (err, response, body) => {
        if (err) {
            return res.status(500).json();
        }
        const token = JSON.parse(body).Token;
        //Request results
        request({
            uri: `${api_uri}/diagnosis?token=${token}&language=en-gb&symptoms=${symptoms}&gender=${gender.toLocaleLowerCase()}&year_of_birth=${year}`,
            method: "GET",
        }, async (error, response, body) => {
            if (err) {
                return res.status(500).json();
            }
            body = JSON.parse(body);
            res.status(200).json(body);
            //Prepare for saving
            const diagnoses = [];
            const specializations = [];
            const patientInfo = [];
            for (let item of body) {
                let issue = item.Issue;
                let exists = await diagnosticExists(issue.ID);
                if (!exists) {
                    diagnoses.push({
                        ID: issue.ID,
                        Name: issue.Name,
                        ProfName: issue.ProfName,
                        Icd: issue.Icd,
                        IcdName: issue.IcdName,
                        Accuracy: issue.Accuracy,
                        valid: false
                    });
                    let specialisation = item.Specialisation;
                    for (let spec of specialisation) {
                        specializations.push({
                            diagnosis: issue.ID,
                            ID: spec.ID,
                            Name: spec.Name,
                            SpecialistID: spec.SpecialistID
                        });
                    }
                }
                patientInfo.push({
                    year_of_birth: year,
                    gender,
                    symptoms: symptomsString,
                    diagnosis: issue.ID,
                    initiator: req.user.email
                });
            }
            //Save
            return sequelize.transaction(t => {
                return Diagnosis.bulkCreate(diagnoses, { transaction: t })
                    .then(res => {
                        return Specialisation.bulkCreate(specializations, { transaction: t });
                    })
                    .then(res => {
                        return PatientInfo.bulkCreate(patientInfo, { transaction: t });
                    })
                    .then(finished => {

                    })
                    .catch(err => {
                        console.log(err);
                    });
            });
        });
    });
}

router.post('/diagnose', async (req, res) => {
    const body = req.body;
    const expected = [body.year_of_birth, body.gender, body.symptoms, +body.year_of_birth];
    if (expected.some(v => v === undefined || v.length === null)) {
        return res.status(422).json({ message: 'year_of_birth, gender and symptoms must be provided.' });
    }
    if (['male', 'female'].indexOf(body.gender.toLowerCase()) === -1) {
        return res.status(422).json({ gender: 'Gender must be male or female.' });
    }
    if (typeof body.symptoms !== "object" || !body.symptoms.length || body.symptoms.length === 0) {
        return res.status(422).json({ symptoms: 'Symptoms must be an array of numbers.' });
    }
    const year = +body.year_of_birth;
    const gender = body.gender;
    const symptoms = body.symptoms.map(v => +v);//Convert into numbers
    //Make sure they are all numbers
    if (symptoms.some(v => v === null)) {
        return res.status(422).json({ symptoms: 'Invalid symptoms detected.' });
    }
    try {
        //Check against saved symptoms
        const validSymptoms = await symptomsValid(symptoms);
        if (!validSymptoms) {
            return res.status(400).json({ message: `Provided symptoms are not valid.` });
        }
        //Sort the IDs so that they can be stored and referenced later easily
        const sortedSymptoms = symptoms.sort((a, b) => {
            return a - b;
        });
        //Make a string for comparison
        const storageString = sortedSymptoms.join(',');
        //Find if their is a previous match in the database
        const cached = await PatientInfo.findAll({ where: { year_of_birth: year, gender, symptoms: storageString } })
        if (cached.length === 0) {
            return runDiagnostics(year, gender, storageString, req, res);
        } else {
            const results = [];
            for (let cache of cached) {
                let pack = {};
                let diagnosis = await Diagnosis.findAll({ where: { ID: cache.diagnosis } })
                if (diagnosis.length === 0) {
                    continue;
                }
                pack.Issue = diagnosis[0];
                pack.Issue.gender = gender;
                pack.Issue.year_of_birth = year;
                let specialisation = await Specialisation.findAll({ where: { diagnosis: cache.diagnosis } });
                pack.Specialisation = specialisation;
                results.push(pack);
            }
            return res.status(200).json(results);
        }
    } catch (error) {
        return res.status(500).json();
    }
});

router.put("/diagnosis/validate", async (req, res) => {
    let validity = req.query.valid || '';
    validity = validity.toLowerCase();
    try {
        const id = req.body.id || null;
        validity = validity === 'true' ? true : false;
        await Diagnosis.update({ valid: validity }, { where: { ID: id } });
        return res.status(200).json();
    } catch (error) {
        return res.status(500).json();
    }
});

/**
 * Populates symptoms into the database
 * @param {Response} res Server response object
 */
async function populateSymptoms(res) {
    //Auhenticate
    request({
        uri: auth_uri,
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.PRIAID_api_key}:${computedHashString}`
        }
    }, (err, response, body) => {
        if (err) {
            return res.status(500).json();
        }
        const token = JSON.parse(body).Token;
        //Request symptoms
        request({
            uri: `${api_uri}/symptoms?token=${token}&language=en-gb`,
            method: "GET"
        }, async (error, response, body) => {
            if (err) {
                return res.status(500).json();
            }
            body = JSON.parse(body);
            res.status(200).json(body);
            try {
                const values = body.map(v => {
                    return {
                        ID: v.ID,
                        Name: v.Name
                    };
                });
                await Symptoms.bulkCreate(values);
            } catch (error) {

            }
        });
    });
}

router.get("/symptoms", async (req, res) => {
    try {
        //Check if there are stored symptoms
        let symptoms = await Symptoms.findAll();
        if (symptoms.length > 0) {
            return res.status(200).json(symptoms);
        } else {
            populateSymptoms(res);
        }
    } catch (e) {
        return res.status(500).json();
    }
});

module.exports = router;