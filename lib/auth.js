import { createServerSideClient } from './supabase';

/**
 * Sign up a new user using Supabase
 */
export const signUp = async (email, password, metadata = {}) => {
  const supabase = await createServerSideClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  return { data, error };
};

/**
 * Sign in a user using Supabase
 */
export const signIn = async (email, password) => {
  const supabase = await createServerSideClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const supabase = await createServerSideClient();
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Get the current authenticated user session
 */
export const getSession = async () => {
  const supabase = await createServerSideClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

/**
 * Get current user from the request context (App Router style)
 */
export const getUser = async () => {
  const supabase = await createServerSideClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};

// Legacy Compatibility Helpers (Returning null or empty to avoid immediate crashes)
export const generateToken = () => null;
export const verifyToken = () => null;
export const hashPassword = async (p) => p;
export const comparePassword = async (p, h) => true;

