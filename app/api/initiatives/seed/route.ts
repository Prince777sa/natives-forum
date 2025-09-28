// app/api/initiatives/seed/route.ts - Seed missing initiatives
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check existing initiatives to avoid duplicates
      const existingResult = await client.query('SELECT title FROM initiatives');
      const existingTitles = existingResult.rows.map(row => row.title);

      console.log('Existing initiatives:', existingTitles);

      // Get banking category id (we know this exists from Commercial Bank initiative)
      const bankingCategoryResult = await client.query('SELECT id FROM categories WHERE name = $1', ['Banking']);
      let bankingCategoryId = bankingCategoryResult.rows[0]?.id;

      // If no banking category, create it
      if (!bankingCategoryId) {
        const categoryResult = await client.query(
          'INSERT INTO categories (name, slug, description, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
          ['Banking', 'banking', 'Banking related initiatives']
        );
        bankingCategoryId = categoryResult.rows[0].id;
      }

      // Get a default author (first user) for new initiatives
      const userResult = await client.query('SELECT id FROM users LIMIT 1');
      const authorId = userResult.rows[0]?.id;

      if (!authorId) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'No users found. Please create a user first.' },
          { status: 400 }
        );
      }

      console.log('Author ID:', authorId);
      console.log('Banking category ID:', bankingCategoryId);

      // Define the initiatives to add
      const initiativesToAdd = [
        {
          title: "Spaza Shop Network",
          description: "Reclaim the informal economy by creating a network of native-owned spaza shops. Support local entrepreneurs and keep money circulating in our communities.",
          content: "The Spaza Shop Network initiative aims to transform South Africa's informal economy by establishing a comprehensive network of native-owned spaza shops.",
          categoryId: bankingCategoryId, // Use existing category for now
          targetParticipants: 2000,
          targetAmount: 50000000
        },
        {
          title: "Food Value Chain",
          description: "Control our food system from farm to table. Invest in sustainable, non-GMO food production and distribution networks owned by our community.",
          content: "The Food Value Chain initiative focuses on achieving food sovereignty through community-owned agricultural systems.",
          categoryId: bankingCategoryId, // Use existing category for now
          targetParticipants: 3000,
          targetAmount: 200000000
        },
        {
          title: "Industrial Development",
          description: "Build manufacturing capacity to produce what we consume. Invest in strategic industries and develop the technical skills needed for economic self-sufficiency.",
          content: "The Industrial Development initiative aims to build South Africa's manufacturing capacity in strategic sectors.",
          categoryId: bankingCategoryId, // Use existing category for now
          targetParticipants: 5000,
          targetAmount: 500000000
        },
        {
          title: "Political Representation",
          description: "Build a political movement that truly represents native interests. Participate in creating policy proposals and candidate selection for future elections.",
          content: "The Political Representation initiative focuses on building authentic political representation for native interests in South Africa.",
          categoryId: bankingCategoryId, // Use existing category for now
          targetParticipants: 10000,
          targetAmount: 100000000
        }
      ];

      // Filter out existing initiatives
      const newInitiatives = initiativesToAdd.filter(
        initiative => !existingTitles.includes(initiative.title)
      );

      console.log('New initiatives to add:', newInitiatives.length);

      if (newInitiatives.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          message: 'All initiatives already exist',
          existing: existingTitles
        });
      }

      const addedInitiatives = [];

      // Add initiatives
      for (const initiative of newInitiatives) {
        console.log('Adding initiative:', initiative.title);

        const result = await client.query(`
          INSERT INTO initiatives (
            title, description, content, status, category_id, author_id,
            target_participants, target_amount, current_participants, current_amount,
            start_date, featured, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id, title
        `, [
          initiative.title,
          initiative.description,
          initiative.content,
          'active', // status
          initiative.categoryId,
          authorId,
          initiative.targetParticipants,
          initiative.targetAmount,
          0, // current_participants
          0, // current_amount
          new Date(), // start_date
          false // featured
        ]);

        addedInitiatives.push({
          id: result.rows[0].id,
          title: result.rows[0].title
        });

        console.log('Added:', result.rows[0].title);
      }

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({
        message: `Successfully added ${addedInitiatives.length} initiatives`,
        added: addedInitiatives
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Seed initiatives error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}