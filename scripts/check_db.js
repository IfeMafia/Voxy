import db from '../src/lib/db.js';

async function checkColumns() {
  try {
    const result = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'businesses'
    `);
    console.log('Columns in businesses table:');
    result.rows.forEach(row => console.log(`- ${row.column_name}`));
    process.exit(0);
  } catch (error) {
    console.error('Error checking columns:', error);
    process.exit(1);
  }
}

checkColumns();
