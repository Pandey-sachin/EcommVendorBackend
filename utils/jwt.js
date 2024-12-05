const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY ||"S3R3TK3Y";


/**
 * Generates a JWT token for the given payload.
 * @param {Object} payload - Data to include in the token.
 * @param {Object} [options] - Additional JWT options (e.g., expiration time).
 * @returns {string} - Signed JWT token.
 */
const generateToken = (payload, options = { expiresIn: '1h' }) => {
    try {
        return jwt.sign(payload, SECRET_KEY, options);
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Token generation failed');
    }
};

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - The JWT token to verify.
 * @returns {Object} - Decoded payload if verification succeeds.
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        console.error('Error verifying token:', error);
        throw new Error('Invalid or expired token');
    }
};

module.exports = {
    generateToken,
    verifyToken,
};
