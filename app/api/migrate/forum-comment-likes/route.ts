// app/api/migrate/forum-comment-likes/route.ts - Create forum_comment_likes table
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Create forum_comment_likes table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS forum_comment_likes (
          id SERIAL PRIMARY KEY,
          comment_id INTEGER NOT NULL,
          user_id UUID NOT NULL,
          is_like BOOLEAN NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comment_id) REFERENCES forum_post_comments(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(comment_id, user_id)
        );
      `;

      await client.query(createTableQuery);

      // Create indexes for better performance
      const createIndexesQuery = `
        CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_comment_id ON forum_comment_likes(comment_id);
        CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_user_id ON forum_comment_likes(user_id);
        CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_is_like ON forum_comment_likes(is_like);
      `;

      await client.query(createIndexesQuery);

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Successfully created forum_comment_likes table and indexes',
        table: 'forum_comment_likes',
        status: 'created'
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}