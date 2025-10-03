// scripts/update-cooperative-initiative.js - Update Spaza Shop/Informal Economy initiative to Cooperative Business Networks
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateCooperativeInitiative() {
  const client = await pool.connect();

  try {
    console.log('Updating initiative to Cooperative Business Networks...\n');

    // First, check if the category exists, if not create it
    const categoryCheck = await client.query(
      "SELECT id FROM categories WHERE name = 'Cooperative Business Networks' OR slug = 'cooperative-business-networks'"
    );

    let categoryId;
    if (categoryCheck.rows.length === 0) {
      console.log('Creating new category: Cooperative Business Networks');
      const categoryResult = await client.query(
        `INSERT INTO categories (name, slug, description, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          'Cooperative Business Networks',
          'cooperative-business-networks',
          'Worker-owned cooperatives across sectors to control our businesses and keep wealth circulating internally'
        ]
      );
      categoryId = categoryResult.rows[0].id;
      console.log('✓ Category created\n');
    } else {
      categoryId = categoryCheck.rows[0].id;
      console.log('✓ Category already exists\n');
    }

    // Find the initiative (it might be called "Spaza Shop Network" or "Informal Economy")
    const initiativeCheck = await client.query(
      `SELECT id, title FROM initiatives
       WHERE title ILIKE '%spaza%' OR title ILIKE '%informal%economy%'
       LIMIT 1`
    );

    if (initiativeCheck.rows.length === 0) {
      console.log('No Spaza Shop or Informal Economy initiative found. Creating new one...');

      // Get a default author (first user)
      const userResult = await client.query('SELECT id FROM users LIMIT 1');
      const authorId = userResult.rows[0]?.id;

      if (!authorId) {
        console.log('No users found. Please create a user first.');
        return;
      }

      const insertResult = await client.query(`
        INSERT INTO initiatives (
          title, slug, description, content, status, category_id, author_id,
          target_participants, target_amount, current_participants, current_amount,
          start_date, featured, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, title
      `, [
        'Cooperative Business Networks',
        'cooperative-business-networks',
        'Create interconnected worker-owned cooperatives across sectors—manufacturing, retail and distribution, services (cleaning, security, transport), and tech/digital services—including control of the informal economy (spaza shops, etc.). These businesses trade preferentially with each other, keeping wealth circulating internally.',
        'Build economic power through interconnected worker-owned cooperatives across all sectors. From manufacturing to retail, from services to tech, these cooperatives will trade preferentially with each other, keeping wealth circulating within our communities and creating a self-sustaining economic ecosystem. This initiative includes establishing manufacturing cooperatives for production control, creating retail and distribution cooperative networks, building service cooperatives (cleaning, security, transport), developing tech and digital service cooperatives, and controlling the informal economy (spaza shops, etc.).',
        'planning',
        categoryId,
        authorId,
        2000, // target_participants
        50000000, // target_amount (R50M)
        0, // current_participants
        0, // current_amount
        new Date(), // start_date
        false // featured
      ]);

      console.log(`✓ Created new initiative: ${insertResult.rows[0].title} (ID: ${insertResult.rows[0].id})`);
    } else {
      const initiativeId = initiativeCheck.rows[0].id;
      console.log(`Found initiative: ${initiativeCheck.rows[0].title} (ID: ${initiativeId})`);
      console.log('Updating to Cooperative Business Networks...\n');

      const updateResult = await client.query(`
        UPDATE initiatives
        SET
          title = $1,
          slug = $2,
          description = $3,
          content = $4,
          category_id = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, title
      `, [
        'Cooperative Business Networks',
        'cooperative-business-networks',
        'Create interconnected worker-owned cooperatives across sectors—manufacturing, retail and distribution, services (cleaning, security, transport), and tech/digital services—including control of the informal economy (spaza shops, etc.). These businesses trade preferentially with each other, keeping wealth circulating internally.',
        'Build economic power through interconnected worker-owned cooperatives across all sectors. From manufacturing to retail, from services to tech, these cooperatives will trade preferentially with each other, keeping wealth circulating within our communities and creating a self-sustaining economic ecosystem. This initiative includes establishing manufacturing cooperatives for production control, creating retail and distribution cooperative networks, building service cooperatives (cleaning, security, transport), developing tech and digital service cooperatives, and controlling the informal economy (spaza shops, etc.).',
        categoryId,
        initiativeId
      ]);

      console.log(`✓ Updated initiative: ${updateResult.rows[0].title} (ID: ${updateResult.rows[0].id})`);
    }

    console.log('\n✅ Initiative successfully updated to Cooperative Business Networks!');

  } catch (error) {
    console.error('Error updating initiative:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateCooperativeInitiative();
