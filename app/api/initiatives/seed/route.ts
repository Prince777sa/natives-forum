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

      // Get all categories from the database
      const categoriesResult = await client.query('SELECT id, name, slug FROM categories');
      const categories = categoriesResult.rows.reduce((acc, row) => {
        acc[row.slug] = row.id;
        return acc;
      }, {} as Record<string, string>);

      console.log('Available categories:', categories);

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

      // Helper function to get category ID by slug or name
      const getCategoryId = (preferredSlug: string, fallbackName?: string) => {
        return categories[preferredSlug] ||
               Object.keys(categories).find(slug =>
                 slug.includes(preferredSlug.split('-')[0])
               ) ||
               (fallbackName && Object.keys(categories).find(slug =>
                 categories[slug] === fallbackName
               )) ||
               categories['banking'] || // fallback to banking if it exists
               Object.values(categories)[0]; // fallback to first category
      };

      // Define the initiatives to add with proper categories
      const initiativesToAdd = [
        {
          title: "Informal Economy",
          description: "Reclaim the informal economy by creating a network of native-owned businesses. Support local entrepreneurs and keep money circulating in our communities.",
          content: "The Informal Economy initiative aims to transform South Africa's informal economy by establishing a comprehensive network of native-owned businesses.",
          categoryId: getCategoryId('informal-economy', 'Informal Economy'),
          targetParticipants: 2000,
          targetAmount: 50000000
        },
        {
          title: "Food Value Chain",
          description: "Control our food system from farm to table. Invest in sustainable, non-GMO food production and distribution networks owned by our community.",
          content: "The Food Value Chain initiative focuses on achieving food sovereignty through community-owned agricultural systems.",
          categoryId: getCategoryId('agriculture', 'Agriculture'),
          targetParticipants: 3000,
          targetAmount: 200000000
        },
        {
          title: "Industrial Development",
          description: "Build manufacturing capacity to produce what we consume. Invest in strategic industries and develop the technical skills needed for economic self-sufficiency.",
          content: "The Industrial Development initiative aims to build South Africa's manufacturing capacity in strategic sectors.",
          categoryId: getCategoryId('manufacturing', 'Manufacturing'),
          targetParticipants: 5000,
          targetAmount: 500000000
        },
        {
          title: "Political Representation",
          description: "Build a political movement that truly represents native interests. Participate in creating policy proposals and candidate selection for future elections.",
          content: "The Political Representation initiative focuses on building authentic political representation for native interests in South Africa.",
          categoryId: getCategoryId('politics', 'Politics'),
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