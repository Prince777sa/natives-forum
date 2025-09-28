import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(_request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      // Create forum_posts table without foreign key constraints first
      const createForumPostsQuery = `
        CREATE TABLE IF NOT EXISTS forum_posts (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          author_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `;

      // Create forum_post_likes table without foreign key constraints first
      const createForumPostLikesQuery = `
        CREATE TABLE IF NOT EXISTS forum_post_likes (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          is_like BOOLEAN NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, user_id)
        )
      `;

      // Create forum_post_comments table
      const createForumPostCommentsQuery = `
        CREATE TABLE IF NOT EXISTS forum_post_comments (
          id SERIAL PRIMARY KEY,
          post_id INTEGER NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          comment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `;

      // Create indexes
      const createIndexesQuery = `
        CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
        CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);
        CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON forum_post_likes(post_id);
        CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user_id ON forum_post_likes(user_id);
        CREATE INDEX IF NOT EXISTS idx_forum_post_comments_post_id ON forum_post_comments(post_id);
        CREATE INDEX IF NOT EXISTS idx_forum_post_comments_user_id ON forum_post_comments(user_id);
      `;

      // Execute all queries
      await client.query(createForumPostsQuery);
      await client.query(createForumPostLikesQuery);
      await client.query(createForumPostCommentsQuery);
      await client.query(createIndexesQuery);

      return NextResponse.json({
        success: true,
        message: 'Forum tables created successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Forum tables migration error:', error);
    return NextResponse.json(
      { error: 'Failed to create forum tables' },
      { status: 500 }
    );
  }
}