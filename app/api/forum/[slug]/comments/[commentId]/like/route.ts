// app/api/forum/[slug]/comments/[commentId]/like/route.ts - Handle comment likes/dislikes
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET!;

// POST - Handle like/dislike on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
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
    const { slug, commentId } = resolvedParams;

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

      // First, get the post ID from slug
      const postQuery = `
        SELECT id FROM forum_posts
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

      // Check if comment exists
      const commentQuery = `
        SELECT id, comment
        FROM forum_post_comments
        WHERE id = $1 AND post_id = $2 AND is_active = true
      `;
      const commentResult = await client.query(commentQuery, [commentId, postId]);

      if (commentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Check if user has already reacted to this comment
      const existingReactionQuery = `
        SELECT id, is_like FROM forum_comment_likes
        WHERE comment_id = $1 AND user_id = $2
      `;
      const existingReactionResult = await client.query(existingReactionQuery, [commentId, userId]);

      let userReaction: boolean | null = null;

      if (existingReactionResult.rows.length > 0) {
        const existingReaction = existingReactionResult.rows[0];

        if (existingReaction.is_like === isLike) {
          // Same reaction - remove it (toggle off)
          await client.query('DELETE FROM forum_comment_likes WHERE id = $1', [existingReaction.id]);
          userReaction = null;
        } else {
          // Different reaction - update it
          await client.query(
            'UPDATE forum_comment_likes SET is_like = $1 WHERE id = $2',
            [isLike, existingReaction.id]
          );
          userReaction = isLike;
        }
      } else {
        // No existing reaction - add new one
        await client.query(
          `INSERT INTO forum_comment_likes (comment_id, user_id, is_like, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [commentId, userId, isLike]
        );
        userReaction = isLike;
      }

      // Get updated like and dislike counts
      const countsQuery = `
        SELECT
          COUNT(CASE WHEN is_like = true THEN 1 END) as like_count,
          COUNT(CASE WHEN is_like = false THEN 1 END) as dislike_count
        FROM forum_comment_likes
        WHERE comment_id = $1
      `;
      const countsResult = await client.query(countsQuery, [commentId]);
      const { like_count, dislike_count } = countsResult.rows[0];

      await client.query('COMMIT');

      return NextResponse.json({
        message: userReaction === null ? 'Reaction removed' :
                userReaction ? 'Comment liked' : 'Comment disliked',
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
    console.error('Comment reaction error:', error);

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