import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

// POST /api/initiatives/comments/[commentId]/like - Toggle like/dislike on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { isLike } = await request.json(); // true for like, false for dislike

    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    if (typeof isLike !== 'boolean') {
      return NextResponse.json(
        { error: 'isLike must be a boolean value' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if comment exists
      const commentQuery = 'SELECT id FROM initiative_comments WHERE id = $1 AND is_active = true';
      const commentResult = await client.query(commentQuery, [commentId]);

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Check if user already has a reaction on this comment
      const existingReactionQuery = `
        SELECT id, is_like FROM comment_likes
        WHERE comment_id = $1 AND user_id = $2
      `;
      const existingReaction = await client.query(existingReactionQuery, [commentId, userId]);

      let result;

      if (existingReaction.rows.length > 0) {
        const currentReaction = existingReaction.rows[0];

        if (currentReaction.is_like === isLike) {
          // Same reaction - remove it (toggle off)
          await client.query('DELETE FROM comment_likes WHERE id = $1', [currentReaction.id]);
          result = { action: 'removed', isLike };
        } else {
          // Different reaction - update it
          await client.query(
            'UPDATE comment_likes SET is_like = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [isLike, currentReaction.id]
          );
          result = { action: 'updated', isLike };
        }
      } else {
        // No existing reaction - create new one
        await client.query(
          'INSERT INTO comment_likes (comment_id, user_id, is_like) VALUES ($1, $2, $3)',
          [commentId, userId, isLike]
        );
        result = { action: 'added', isLike };
      }

      // Get updated like/dislike counts and user's current reaction
      const countsQuery = `
        SELECT
          COUNT(CASE WHEN is_like = true THEN 1 END) as like_count,
          COUNT(CASE WHEN is_like = false THEN 1 END) as dislike_count,
          (SELECT is_like FROM comment_likes WHERE comment_id = $1 AND user_id = $2) as user_reaction
        FROM comment_likes
        WHERE comment_id = $1
      `;

      const countsResult = await client.query(countsQuery, [commentId, userId]);
      const counts = countsResult.rows[0];

      return NextResponse.json({
        success: true,
        action: result.action,
        likeCount: parseInt(counts.like_count) || 0,
        dislikeCount: parseInt(counts.dislike_count) || 0,
        userReaction: counts.user_reaction // null, true (like), or false (dislike)
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error handling comment reaction:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process reaction' },
      { status: 500 }
    );
  }
}