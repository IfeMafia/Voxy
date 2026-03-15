import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'voxy-secret-key-change-me';

/**
 * Generate a JWT token
 * @param {Object} payload 
 * @param {string} expiresIn 
 */
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token 
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Hash a plain text password
 * @param {string} password 
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain text password with hashed password
 * @param {string} password 
 * @param {string} hashedPassword 
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Get user from authorization header
 * @param {Request} req 
 */
export const getUserFromRequest = (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  return verifyToken(token);
};
