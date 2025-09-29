// scripts/add-initiatives.js - Add missing initiatives to database
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addInitiatives() {
  const client = await pool.connect();

  try {
    // First, let's check existing categories
    console.log('Checking existing categories...');
    const categoriesResult = await client.query('SELECT id, name, slug FROM categories');
    console.log('Existing categories:', categoriesResult.rows);

    // Check existing initiatives
    console.log('\nChecking existing initiatives...');
    const initiativesResult = await client.query('SELECT id, title, status FROM initiatives');
    console.log('Existing initiatives:', initiativesResult.rows);

    // Get a default author (first user) for new initiatives
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    const authorId = userResult.rows[0]?.id;

    if (!authorId) {
      console.log('No users found. Please create a user first.');
      return;
    }

    // Define the initiatives to add (excluding Commercial Bank which already exists)
    const initiativesToAdd = [
      {
        title: "Spaza Shop Network",
        description: "Reclaim the informal economy by creating a network of native-owned businesses. Support local entrepreneurs and keep money circulating in our communities.",
        content: "The Spaza Shop Network initiative aims to transform South Africa's informal economy by establishing a comprehensive network of native-owned spaza shops. This program will provide training, mentorship, and financial support to new spaza shop owners while integrating modern payment systems and connecting to our banking infrastructure. Through this initiative, we will create sustainable livelihoods, keep money circulating within our communities, and build economic resilience from the ground up.",
        status: "planning",
        categoryName: "Informal Economy",
        targetParticipants: 2000,
        targetAmount: 50000000 // R50M
      },
      {
        title: "Food Value Chain",
        description: "Control our food system from farm to table. Invest in sustainable, non-GMO food production and distribution networks owned by our community.",
        content: "The Food Value Chain initiative focuses on achieving food sovereignty through community-owned agricultural systems. This comprehensive program covers sustainable farming practices, non-GMO seed development, processing facilities, and distribution networks. By controlling every aspect of our food system, we ensure food security, fair pricing for consumers, and economic opportunities for our farming communities while maintaining environmental sustainability.",
        status: "planning",
        categoryName: "Agriculture",
        targetParticipants: 3000,
        targetAmount: 200000000 // R200M
      },
      {
        title: "Industrial Development",
        description: "Build manufacturing capacity to produce what we consume. Invest in strategic industries and develop the technical skills needed for economic self-sufficiency.",
        content: "The Industrial Development initiative aims to build South Africa's manufacturing capacity in strategic sectors. This program includes identifying priority industries, establishing manufacturing facilities, developing technical skills through education and training programs, and creating supply chains that serve our domestic market. Through this initiative, we will reduce import dependence, create high-quality jobs, and build the industrial base necessary for true economic independence.",
        status: "planning",
        categoryName: "Industry",
        targetParticipants: 5000,
        targetAmount: 500000000 // R500M
      },
      {
        title: "Political Representation",
        description: "Build a political movement that truly represents native interests. Participate in creating policy proposals and candidate selection for future elections.",
        content: "The Political Representation initiative focuses on building authentic political representation for native interests in South Africa. This program includes policy proposal development, candidate vetting processes, community consultation mechanisms, and electoral strategy planning. Through democratic participation and consensus-building, we will ensure that our political representatives truly reflect community priorities and work toward policies that advance native economic empowerment and social justice.",
        status: "planning",
        categoryName: "Politics",
        targetParticipants: 10000,
        targetAmount: 100000000 // R100M
      }
    ];

    // Create categories if they don't exist
    const categoryMap = {};
    for (const existing of categoriesResult.rows) {
      categoryMap[existing.name] = existing.id;
    }

    for (const initiative of initiativesToAdd) {
      if (!categoryMap[initiative.categoryName]) {
        console.log(`Creating category: ${initiative.categoryName}`);
        const slug = initiative.categoryName.toLowerCase().replace(/\s+/g, '-');
        const categoryResult = await client.query(
          'INSERT INTO categories (name, slug, description, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
          [initiative.categoryName, slug, `${initiative.categoryName} related initiatives`]
        );
        categoryMap[initiative.categoryName] = categoryResult.rows[0].id;
      }
    }

    // Add initiatives
    for (const initiative of initiativesToAdd) {
      console.log(`\nAdding initiative: ${initiative.title}`);

      const slug = initiative.title.toLowerCase().replace(/\s+/g, '-');
      const categoryId = categoryMap[initiative.categoryName];

      const result = await client.query(`
        INSERT INTO initiatives (
          title, slug, description, content, status, category_id, author_id,
          target_participants, target_amount, current_participants, current_amount,
          start_date, featured, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, title
      `, [
        initiative.title,
        slug,
        initiative.description,
        initiative.content,
        initiative.status,
        categoryId,
        authorId,
        initiative.targetParticipants,
        initiative.targetAmount,
        0, // current_participants
        0, // current_amount
        new Date(), // start_date
        false // featured
      ]);

      console.log(`✓ Added: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
    }

    console.log('\n✅ All initiatives added successfully!');

  } catch (error) {
    console.error('Error adding initiatives:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addInitiatives();