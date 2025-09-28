import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(_request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      console.log('Starting nested comments migration...');

      // Check if column already exists
      const checkColumn = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'initiative_comments'
        AND column_name = 'parent_comment_id'
      `);

      if (checkColumn.rows.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Migration already applied: parent_comment_id column exists'
        });
      }

      // Add parent_comment_id column
      await client.query(`
        ALTER TABLE initiative_comments
        ADD COLUMN parent_comment_id UUID REFERENCES initiative_comments(id) ON DELETE CASCADE
      `);

      // Add indexes for better performance
      await client.query(`
        CREATE INDEX idx_initiative_comments_parent_id ON initiative_comments(parent_comment_id)
      `);

      await client.query(`
        CREATE INDEX idx_initiative_comments_top_level ON initiative_comments(initiative_id) WHERE parent_comment_id IS NULL
      `);

      console.log('✅ Migration completed successfully!');

      return NextResponse.json({
        success: true,
        message: 'Nested comments migration completed successfully',
        changes: [
          'Added parent_comment_id column',
          'Added performance indexes'
        ]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}