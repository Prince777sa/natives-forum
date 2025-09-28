// app/api/categories/route.ts - Get all categories
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Get all categories
      const categoriesQuery = `
        SELECT id, name, slug, description, created_at
        FROM categories
        ORDER BY name ASC
      `;

      const result = await client.query(categoriesQuery);

      const categories = result.rows.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: category.created_at
      }));

      return NextResponse.json({
        categories,
        total: categories.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}