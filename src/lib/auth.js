import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-change-this';
const TOKEN_NAME = 'voxy_auth_token';

/**
 * Hash a plain text password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hash
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify a JWT token (Edge compatible)
 */
export const verifyTokenEdge = async (token) => {
  try {
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    // console.error('Edge Verify Token Error:', error);
    return null;
  }
};

/**
 * Verify a JWT token (Node.js)
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Set auth cookie in Next.js
 */
export const setAuthCookie = async (token) => {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
};

/**
 * Clear auth cookie
 */
export const clearAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, '', { maxAge: 0 });
};

/**
 * Get user from cookie (Server Side)
 */
export const getUserFromCookie = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
};

// --- User Helpers ---

/**
 * Alias for getUserFromCookie
 */
export const getUser = async () => {
  return await getUserFromCookie();
};

/**
 * Get user from request (generic wrapper for getUserFromCookie)
 */
export const getUserFromRequest = async (req) => {
  // In Next.js App Router, we usually just use cookies() directly
  return await getUserFromCookie();
};
