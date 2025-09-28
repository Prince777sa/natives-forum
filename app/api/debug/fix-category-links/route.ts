// app/api/debug/fix-category-links/route.ts - Fix initiative category linkages
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Get all categories first
      const categoriesResult = await client.query('SELECT id, name, slug FROM categories');
      const categories = categoriesResult.rows;

      console.log('Available categories:', categories);

      // Define the mapping from initiative titles to category slugs
      const initiativeCategoryMapping = [
        { titlePattern: 'Commercial Bank', categorySlug: 'banking' },
        { titlePattern: 'Spaza Shop', categorySlug: 'informal-economy' },
        { titlePattern: 'Food Value Chain', categorySlug: 'agriculture-food' },
        { titlePattern: 'Industrial Development', categorySlug: 'manufacturing-industry' },
        { titlePattern: 'Political Representation', categorySlug: 'politics-governance' }
      ];

      const updates = [];

      // Update each initiative with the correct category
      for (const mapping of initiativeCategoryMapping) {
        // Find the category ID
        const category = categories.find(c => c.slug === mapping.categorySlug);

        if (!category) {
          console.log(`Warning: Category with slug '${mapping.categorySlug}' not found`);
          continue;
        }

        // Update initiatives that match the title pattern
        const updateResult = await client.query(`
          UPDATE initiatives
          SET category_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE title ILIKE $2
          RETURNING id, title
        `, [category.id, `%${mapping.titlePattern}%`]);

        if (updateResult.rows.length > 0) {
          updates.push({
            categoryName: category.name,
            categorySlug: category.slug,
            updatedInitiatives: updateResult.rows
          });
          console.log(`Updated ${updateResult.rows.length} initiatives for category: ${category.name}`);
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      // Get final status
      const finalResult = await client.query(`
        SELECT
          i.title,
          c.name as category_name,
          c.slug as category_slug
        FROM initiatives i
        LEFT JOIN categories c ON i.category_id = c.id
        ORDER BY i.title
      `);

      return NextResponse.json({
        message: 'Successfully updated initiative category links',
        updates,
        finalStatus: finalResult.rows
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Fix category links error:', error);
    return NextResponse.json(
      { error: 'Failed to fix category links', details: (error as Error).message },
      { status: 500 }
    );
  }
}