/**
 * Checks whether a given string matches an email address fromat
 * @param {string} str The string to test
 * @returns boolean
 */
function isEmail(str) {
    return /[a-z0-9.]+[@]{1}[a-z0-9-]+[.]{1}[a-z0-9-]+/i.test(str);
}

/**
 * Checks whether a given string is a valid name
 * @param {string} str The string to test
 */
function isValidName(str) {
    return /^[a-z' ]+$/i.test(str);
}

module.exports = {
    isEmail,
    isValidName
};