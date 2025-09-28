import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

// GET /api/initiatives/[id]/comments - Get comments for an initiative
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await pool.connect();

    try {
      // Get user ID from token for user-specific reactions (if authenticated)
      let currentUserId = null;
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
          currentUserId = decoded.userId;
        } catch (error) {
          // Token invalid, continue without user-specific data
        }
      }

      const commentsQuery = `
        SELECT
          ic.id,
          ic.comment,
          ic.created_at,
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.profile_image_url,
          u.user_role,
          u.verification_status,
          COALESCE(like_counts.like_count, 0) as like_count,
          COALESCE(like_counts.dislike_count, 0) as dislike_count,
          user_reaction.is_like as user_reaction
        FROM initiative_comments ic
        JOIN users u ON ic.user_id = u.id
        LEFT JOIN (
          SELECT
            comment_id,
            COUNT(CASE WHEN is_like = true THEN 1 END) as like_count,
            COUNT(CASE WHEN is_like = false THEN 1 END) as dislike_count
          FROM comment_likes
          GROUP BY comment_id
        ) like_counts ON ic.id = like_counts.comment_id
        LEFT JOIN (
          SELECT comment_id, is_like
          FROM comment_likes
          WHERE user_id = $2
        ) user_reaction ON ic.id = user_reaction.comment_id
        WHERE ic.initiative_id = $1 AND ic.is_active = true AND u.is_active = true
        ORDER BY ic.created_at DESC
      `;

      const commentsResult = await client.query(commentsQuery, [id, currentUserId]);

      return NextResponse.json({
        comments: commentsResult.rows
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching initiative comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/initiatives/[id]/comments - Add a comment to an initiative
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { comment } = await request.json();

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

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    if (comment.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be 500 characters or less' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // First verify the initiative exists
      const initiativeQuery = 'SELECT id FROM initiatives WHERE id = $1';
      const initiativeResult = await client.query(initiativeQuery, [id]);

      if (initiativeResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Initiative not found' },
          { status: 404 }
        );
      }


      // Insert the comment
      const insertQuery = `
        INSERT INTO initiative_comments (initiative_id, user_id, comment)
        VALUES ($1, $2, $3)
        RETURNING id, comment, created_at
      `;

      const result = await client.query(insertQuery, [id, userId, comment.trim()]);
      const newComment = result.rows[0];

      // Get user details for the response
      const userQuery = `
        SELECT first_name, last_name, profile_image_url, user_role, verification_status
        FROM users
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];

      return NextResponse.json({
        success: true,
        comment: {
          id: newComment.id,
          comment: newComment.comment,
          created_at: newComment.created_at,
          user_id: userId,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image_url: user.profile_image_url,
          user_role: user.user_role,
          verification_status: user.verification_status,
          like_count: 0,
          dislike_count: 0,
          user_reaction: null
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error adding initiative comment:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}