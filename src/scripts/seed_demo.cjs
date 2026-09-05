const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const databaseUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
const databaseUrl = databaseUrlLine.split('=')[1].replace(/"/g, '').trim();

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const passwordHash = await bcrypt.hash("Winner#1", 10);
    const email = "ifemafiaa@gmail.com";
    const name = "Beans Haven (Demo)";
    const slug = "beans-haven-demo";

    // Check if business exists
    const checkRes = await pool.query('SELECT id FROM "Business" WHERE LOWER(email) = LOWER($1)', [email]);

    if (checkRes.rows.length > 0) {
      const bizId = checkRes.rows[0].id;
      await pool.query(
        'UPDATE "Business" SET "passwordHash" = $1, "isVerified" = true, "supportedLanguages" = $2 WHERE id = $3',
        [passwordHash, ['en', 'pcm', 'yo'], bizId]
      );
      console.log('Demo business updated successfully:', bizId);
    } else {
      const id = 'biz_demo_ifemafiaa';
      await pool.query(
        `INSERT INTO "Business" (
          id, name, slug, email, "passwordHash", "isVerified", "supportedLanguages", "policies", "deliveryInfo", "hours", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          id,
          name,
          slug,
          email,
          passwordHash,
          ['en', 'pcm', 'yo'],
          '7-day exchange for defective items. No cash refunds once seals are broken.',
          'Standard delivery within 24-48 hours. Express same-day delivery available.',
          JSON.stringify({
            mon: { open: "08:00", close: "20:00", closed: false },
            tue: { open: "08:00", close: "20:00", closed: false },
            wed: { open: "08:00", close: "20:00", closed: false },
            thu: { open: "08:00", close: "20:00", closed: false },
            fri: { open: "08:00", close: "20:00", closed: false },
            sat: { open: "09:00", close: "18:00", closed: false },
            sun: { open: "10:00", close: "16:00", closed: true }
          })
        ]
      );
      console.log('Demo business inserted successfully:', id);
    }
  } catch (err) {
    console.error('Error seeding demo account:', err);
  } finally {
    await pool.end();
  }
}

main();
