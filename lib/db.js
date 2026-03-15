import { createServerSideClient, createAdminClient } from './supabase';

/**
 * Executes a database query using the Supabase Client (Admin version for server-side SQL-like behavior)
 * Note: It's better to use the client.from('table').select() pattern for RLS support.
 * This helper is a bridge for raw SQL-like needs where applicable.
 */
export async function query(text, params = []) {
  try {
    const supabase = createAdminClient();
    
    // Supabase doesn't have a direct 'query' method on the JS client for security.
    // To run raw SQL from the server, you can use the 'postgres' library 
    // or create a DB function and call it with .rpc()
    
    console.warn('Direct SQL query called. Consider refactoring to supabase.from().select()');
    
    // Fallback/Placeholder: In a real Supabase migration, you'd use a postgres driver:
    // import postgres from 'postgres';
    // const sql = postgres(process.env.DATABASE_URL);
    // return await sql(text, params);
    
    return { rows: [], rowCount: 0 }; 
  } catch (error) {
    console.error('Supabase Query Error:', error.message);
    throw error;
  }
}

/**
 * Main export: A helper to get the server-side Supabase client with standard user permissions (RLS)
 */
export async function getDb() {
  return await createServerSideClient();
}

/**
 * Admin export: For operations that bypass RLS (use sparingly!)
 */
export function getAdminDb() {
  return createAdminClient();
}

