import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { errorResponse } from './response';

const JWT_SECRET = process.env.JWT_SECRET || 'voxy_v2_default_jwt_secret_key_dev';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  businessId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

export interface AuthContext {
  businessId: string;
  email: string;
}

export function getAuthUser(req: NextRequest): AuthContext | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  return verifyToken(token);
}

export function requireAuth(req: NextRequest): AuthContext {
  const user = getAuthUser(req);
  if (!user) {
    throw new AuthError('UNAUTHORIZED', 'Invalid or missing access token');
  }
  return user;
}

export class AuthError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 401) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
