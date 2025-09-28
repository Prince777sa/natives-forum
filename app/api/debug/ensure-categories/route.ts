// app/api/debug/ensure-categories/route.ts - Ensure all necessary categories exist
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Define all required categories
      const requiredCategories = [
        {
          name: 'Banking',
          slug: 'banking',
          description: 'Banking and financial services initiatives'
        },
        {
          name: 'Informal Economy',
          slug: 'informal-economy',
          description: 'Initiatives focused on the informal economy and small business development'
        },
        {
          name: 'Agriculture & Food',
          slug: 'agriculture-food',
          description: 'Food production, agriculture, and food security initiatives'
        },
        {
          name: 'Manufacturing & Industry',
          slug: 'manufacturing-industry',
          description: 'Industrial development and manufacturing initiatives'
        },
        {
          name: 'Politics & Governance',
          slug: 'politics-governance',
          description: 'Political representation and governance initiatives'
        }
      ];

      const createdCategories = [];
      const existingCategories = [];

      for (const category of requiredCategories) {
        try {
          // Try to insert the category
          const result = await client.query(`
            INSERT INTO categories (name, slug, description, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, name, slug
          `, [category.name, category.slug, category.description]);

          createdCategories.push(result.rows[0]);
          console.log(`Created category: ${category.name}`);

        } catch (error: any) {
          if (error.code === '23505') { // unique violation - category already exists
            const existingResult = await client.query(
              'SELECT id, name, slug FROM categories WHERE slug = $1',
              [category.slug]
            );
            if (existingResult.rows.length > 0) {
              existingCategories.push(existingResult.rows[0]);
              console.log(`Category already exists: ${category.name}`);
            }
          } else {
            throw error;
          }
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      // Get all categories
      const allCategoriesResult = await client.query('SELECT id, name, slug FROM categories ORDER BY name');

      return NextResponse.json({
        message: 'Successfully ensured all categories exist',
        created: createdCategories,
        existing: existingCategories,
        allCategories: allCategoriesResult.rows
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Ensure categories error:', error);
    return NextResponse.json(
      { error: 'Failed to ensure categories exist', details: (error as Error).message },
      { status: 500 }
    );
  }
}