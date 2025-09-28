// scripts/check-initiatives.js - Check current initiatives
const { Pool } = require('pg');

async function checkInitiatives() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Checking current initiatives...\n');

    // Get all initiatives
    const initiativesQuery = `
      SELECT
        i.*,
        c.name as category_name,
        u.first_name || ' ' || u.last_name as author_name
      FROM initiatives i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.author_id = u.id
      ORDER BY i.created_at DESC;
    `;

    const result = await pool.query(initiativesQuery);

    if (result.rows.length === 0) {
      console.log('❌ No initiatives found in database');
      return;
    }

    console.log('📋 Current Initiatives:');
    console.log('=======================');

    result.rows.forEach((initiative, index) => {
      console.log(`\n🔸 Initiative ${index + 1}:`);
      console.log(`  ID: ${initiative.id}`);
      console.log(`  Title: ${initiative.title}`);
      console.log(`  Description: ${initiative.description}`);
      console.log(`  Status: ${initiative.status}`);
      console.log(`  Category: ${initiative.category_name || 'No category'}`);
      console.log(`  Author: ${initiative.author_name || 'No author'}`);
      console.log(`  Target Participants: ${initiative.target_participants || 'Not set'}`);
      console.log(`  Current Participants: ${initiative.current_participants || 0}`);
      console.log(`  Target Amount: R${initiative.target_amount || 'Not set'}`);
      console.log(`  Current Amount: R${initiative.current_amount || 0}`);
      console.log(`  Start Date: ${initiative.start_date || 'Not set'}`);
      console.log(`  End Date: ${initiative.end_date || 'Not set'}`);
      console.log(`  Created: ${initiative.created_at}`);
      console.log(`  Updated: ${initiative.updated_at}`);
    });

    // Check pledges for each initiative
    console.log('\n💰 Pledge Summary:');
    console.log('==================');

    for (const initiative of result.rows) {
      const pledgesQuery = `
        SELECT
          COUNT(*) as pledge_count,
          SUM(amount) as total_amount
        FROM initiative_pledges
        WHERE initiative_id = $1;
      `;

      const pledgeResult = await pool.query(pledgesQuery, [initiative.id]);
      const pledgeData = pledgeResult.rows[0];

      console.log(`\n🔸 ${initiative.title}:`);
      console.log(`  Pledges: ${pledgeData.pledge_count}`);
      console.log(`  Total Amount: R${pledgeData.total_amount || 0}`);
    }

    // Check categories
    console.log('\n📂 Available Categories:');
    console.log('========================');

    const categoriesQuery = 'SELECT * FROM categories ORDER BY name';
    const categoriesResult = await pool.query(categoriesQuery);

    categoriesResult.rows.forEach(category => {
      console.log(`  • ${category.name} (${category.slug}) - ${category.description || 'No description'}`);
    });

  } catch (error) {
    console.error('❌ Error checking initiatives:', error);
  } finally {
    await pool.end();
  }
}

checkInitiatives();