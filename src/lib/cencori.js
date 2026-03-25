import { Cencori } from 'cencori';

/**
 * Shared Cencori Client
 * Ref: https://cencori.com/docs
 */
export const cencoriClient = new Cencori({
  apiKey: process.env.CENCORI_SECRET_KEY || process.env.CENCORI_API_KEY,
});
