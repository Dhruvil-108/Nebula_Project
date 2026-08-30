const bcrypt = require('bcryptjs');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * Hashes a plain-text password.
 * @param {string} plain - The raw password from the user.
 * @returns {Promise<string>} The bcrypt hash.
 */
const hashPassword = async (plain) => {
  return bcrypt.hash(plain, ROUNDS);
};

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * @param {string} plain - The raw password from the login form.
 * @param {string} hash - The stored bcrypt hash.
 * @returns {Promise<boolean>} True if matching.
 */
const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

module.exports = { hashPassword, comparePassword };
