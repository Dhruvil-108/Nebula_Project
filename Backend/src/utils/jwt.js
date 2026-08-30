const jwt = require('jsonwebtoken');

const ACCESS_SECRET = () => {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error('JWT_ACCESS_SECRET not set');
  return s;
};

const REFRESH_SECRET = () => {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_REFRESH_SECRET not set');
  return s;
};

const ACCESS_EXPIRES = () => process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = () => process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Signs a short-lived access token.
 * Payload includes: sub (userId), orgId, role.
 *
 * @param {{ userId: string, orgId: string, role: string }} payload
 * @returns {string} Signed JWT
 */
const signAccessToken = ({ userId, orgId, role }) => {
  return jwt.sign(
    { sub: userId, orgId, role },
    ACCESS_SECRET(),
    { expiresIn: ACCESS_EXPIRES() }
  );
};

/**
 * Signs a longer-lived refresh token.
 * Payload is minimal — only the userId (sub).
 *
 * @param {{ userId: string }} payload
 * @returns {string} Signed JWT
 */
const signRefreshToken = ({ userId }) => {
  return jwt.sign(
    { sub: userId },
    REFRESH_SECRET(),
    { expiresIn: REFRESH_EXPIRES() }
  );
};

/**
 * Verifies an access token.
 * @param {string} token
 * @returns {{ sub: string, orgId: string, role: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET());
};

/**
 * Verifies a refresh token.
 * @param {string} token
 * @returns {{ sub: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET());
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
