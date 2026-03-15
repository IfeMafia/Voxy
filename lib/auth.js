import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'voxy-secret-key-change-me';

/**
 * Sign a new JWT token
 * @param {Object} payload - Data to include in the token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} token
 */
export const signToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token - Token to verify
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
};

/**
 * Get user from authorization header
 * @param {Request} req - Next.js Request object
 */
export const getUserFromRequest = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  return verifyToken(token);
};
