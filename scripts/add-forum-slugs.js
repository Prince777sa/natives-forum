// scripts/add-forum-slugs.js - Add slug column to forum_posts table and populate with existing post titles
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Utility function to generate slugs (same as in utils.ts)
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .substring(0, 100) // Limit length to 100 characters
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

async function addForumSlugs() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    console.log('Starting forum slug migration...');

    // Step 1: Add slug column to forum_posts table if it doesn't exist
    console.log('Adding slug column to forum_posts table...');
    await client.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE forum_posts ADD COLUMN slug VARCHAR(100);
        EXCEPTION
          WHEN duplicate_column THEN
            RAISE NOTICE 'Column slug already exists in forum_posts table';
        END;
      END $$;
    `);

    // Step 2: Create unique index for slugs (allowing duplicates for now, we'll handle conflicts)
    console.log('Creating index for slugs...');
    await client.query(`
      DO $$
      BEGIN
        BEGIN
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_posts_slug ON forum_posts(slug);
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'Index for slug already exists or could not be created';
        END;
      END $$;
    `);

    // Step 3: Get all forum posts that don't have slugs
    console.log('Fetching posts without slugs...');
    const postsResult = await client.query(`
      SELECT id, title FROM forum_posts
      WHERE slug IS NULL AND is_active = true
      ORDER BY created_at ASC
    `);

    console.log(`Found ${postsResult.rows.length} posts to update with slugs`);

    // Step 4: Generate and update slugs for each post
    const slugCounts = {};
    for (const post of postsResult.rows) {
      let baseSlug = generateSlug(post.title);
      if (!baseSlug) {
        baseSlug = `post-${post.id}`;
      }

      // Handle duplicate slugs by appending a number
      let finalSlug = baseSlug;
      let counter = 1;

      while (slugCounts[finalSlug]) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      slugCounts[finalSlug] = true;

      // Update the post with the slug
      await client.query(
        'UPDATE forum_posts SET slug = $1 WHERE id = $2',
        [finalSlug, post.id]
      );

      console.log(`Updated post ${post.id}: "${post.title}" -> "${finalSlug}"`);
    }

    // Step 5: Add unique constraint for future posts (with some delay for existing data)
    console.log('Adding unique constraint for future slug uniqueness...');
    await client.query(`
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE forum_posts ADD CONSTRAINT unique_forum_post_slug UNIQUE (slug);
        EXCEPTION
          WHEN duplicate_table THEN
            RAISE NOTICE 'Unique constraint for slug already exists';
        END;
      END $$;
    `);

    console.log('Forum slug migration completed successfully!');

  } catch (error) {
    console.error('Error during forum slug migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addForumSlugs()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addForumSlugs };