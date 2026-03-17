const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query(`
      UPDATE users 
      SET role = 'business' 
      WHERE role = 'business_owner'
      RETURNING id, email, role;
    `);

    console.log(`Updated ${result.rowCount} users from 'business_owner' to 'business'`);
    if (result.rowCount > 0) {
      console.log('Updated users:', result.rows);
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
