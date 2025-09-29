// app/api/forum/[slug]/like/route.ts - Handle forum post likes/dislikes by slug
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET!;

// POST - Handle like/dislike on a forum post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    // Get the isLike parameter from request body
    const { isLike } = await request.json();

    if (typeof isLike !== 'boolean') {
      return NextResponse.json(
        { error: 'isLike parameter must be a boolean' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if forum post exists and get ID
      const postQuery = `
        SELECT id, title
        FROM forum_posts
        WHERE slug = $1 AND is_active = true
      `;
      const postResult = await client.query(postQuery, [slug]);

      if (postResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Forum post not found' },
          { status: 404 }
        );
      }

      const postId = postResult.rows[0].id;

      // Check if user has already reacted to this post
      const existingReactionQuery = `
        SELECT id, is_like FROM forum_post_likes
        WHERE post_id = $1 AND user_id = $2
      `;
      const existingReactionResult = await client.query(existingReactionQuery, [postId, userId]);

      let userReaction: boolean | null = null;

      if (existingReactionResult.rows.length > 0) {
        const existingReaction = existingReactionResult.rows[0];

        if (existingReaction.is_like === isLike) {
          // Same reaction - remove it (toggle off)
          await client.query('DELETE FROM forum_post_likes WHERE id = $1', [existingReaction.id]);
          userReaction = null;
        } else {
          // Different reaction - update it
          await client.query(
            'UPDATE forum_post_likes SET is_like = $1 WHERE id = $2',
            [isLike, existingReaction.id]
          );
          userReaction = isLike;
        }
      } else {
        // No existing reaction - add new one
        await client.query(
          `INSERT INTO forum_post_likes (post_id, user_id, is_like, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [postId, userId, isLike]
        );
        userReaction = isLike;
      }

      // Get updated like and dislike counts
      const countsQuery = `
        SELECT
          COUNT(CASE WHEN is_like = true THEN 1 END) as like_count,
          COUNT(CASE WHEN is_like = false THEN 1 END) as dislike_count
        FROM forum_post_likes
        WHERE post_id = $1
      `;
      const countsResult = await client.query(countsQuery, [postId]);
      const { like_count, dislike_count } = countsResult.rows[0];

      await client.query('COMMIT');

      return NextResponse.json({
        message: userReaction === null ? 'Reaction removed' :
                userReaction ? 'Post liked' : 'Post disliked',
        likeCount: parseInt(like_count) || 0,
        dislikeCount: parseInt(dislike_count) || 0,
        userReaction: userReaction
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Forum post reaction error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}