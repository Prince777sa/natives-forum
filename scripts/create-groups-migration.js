// Script to create groups/branches tables in the database
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Reading SQL migration file...');
    const sqlFilePath = path.join(__dirname, 'create-groups-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('Created tables:');
    console.log('  - groups');
    console.log('  - group_members');
    console.log('  - group_posts');
    console.log('  - group_post_comments');
    console.log('  - Related indexes and triggers');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('groups', 'group_members', 'group_posts', 'group_post_comments')
      ORDER BY table_name
    `);

    console.log('\nVerified tables in database:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
