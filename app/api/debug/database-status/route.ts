// app/api/debug/database-status/route.ts - Check database status
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Get all categories
      const categoriesResult = await client.query('SELECT id, name, slug FROM categories ORDER BY name');

      // Get all initiatives with their current category associations
      const initiativesResult = await client.query(`
        SELECT
          i.id,
          i.title,
          i.category_id,
          c.name as category_name,
          c.slug as category_slug
        FROM initiatives i
        LEFT JOIN categories c ON i.category_id = c.id
        ORDER BY i.title
      `);

      // Check for any initiatives without categories
      const orphanedInitiatives = await client.query(`
        SELECT id, title, category_id
        FROM initiatives
        WHERE category_id IS NULL OR category_id NOT IN (SELECT id FROM categories)
      `);

      return NextResponse.json({
        categories: categoriesResult.rows,
        initiatives: initiativesResult.rows,
        orphanedInitiatives: orphanedInitiatives.rows,
        summary: {
          totalCategories: categoriesResult.rows.length,
          totalInitiatives: initiativesResult.rows.length,
          orphanedCount: orphanedInitiatives.rows.length
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database status', details: (error as Error).message },
      { status: 500 }
    );
  }
}