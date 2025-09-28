// app/api/initiatives/fix-categories/route.ts - Fix initiative categories
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Create missing categories
      const categories = [
        { name: 'Informal Economy', slug: 'informal-economy', description: 'Initiatives focused on the informal economy and small business development' },
        { name: 'Agriculture & Food', slug: 'agriculture-food', description: 'Food production, agriculture, and food security initiatives' },
        { name: 'Manufacturing & Industry', slug: 'manufacturing-industry', description: 'Industrial development and manufacturing initiatives' },
        { name: 'Politics & Governance', slug: 'politics-governance', description: 'Political representation and governance initiatives' }
      ];

      const createdCategories = [];

      for (const category of categories) {
        try {
          const result = await client.query(
            'INSERT INTO categories (name, slug, description, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id, name',
            [category.name, category.slug, category.description]
          );
          createdCategories.push(result.rows[0]);
        } catch (error: unknown) {
          // Category might already exist, skip
          const dbError = error as { code?: string };
          if (dbError.code === '23505') { // unique violation
            console.log(`Category ${category.name} already exists`);
          } else {
            throw error;
          }
        }
      }

      // Update initiatives with correct categories
      const initiativeUpdates = [
        { title: 'Spaza Shop Network', categorySlug: 'informal-economy' },
        { title: 'Food Value Chain', categorySlug: 'agriculture-food' },
        { title: 'Industrial Development', categorySlug: 'manufacturing-industry' },
        { title: 'Political Representation', categorySlug: 'politics-governance' }
      ];

      const updatedInitiatives = [];

      for (const update of initiativeUpdates) {
        const result = await client.query(`
          UPDATE initiatives
          SET category_id = (SELECT id FROM categories WHERE slug = $1), updated_at = CURRENT_TIMESTAMP
          WHERE title = $2
          RETURNING id, title
        `, [update.categorySlug, update.title]);

        if (result.rows.length > 0) {
          updatedInitiatives.push(result.rows[0]);
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Successfully fixed initiative categories',
        createdCategories,
        updatedInitiatives
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Fix categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}