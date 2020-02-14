/**
 * Formats a string into title
 * john => John
 * JOHN => John
 * jOhN => John
 * john doe => John Doe
 * @param str String to format
 */
function titlecase(str) {
    if (typeof str !== "string") return '';
    str = str.trim();
    if (str.length === 0) return '';
    str = str.split(' ').map(s => {
        if (s.length === 1) return str.toUpperCase();
        let fisrt = s[0].toUpperCase();
        let rest = s.substring(1).toLowerCase();
        return fisrt + rest;
    }).join(' ');
    return str;
}

module.exports = {
    titlecase
}