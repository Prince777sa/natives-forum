// app/api/forum/[id]/comments/route.ts - Handle forum post comments
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

interface JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

// Validation schema for comment submission
const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

// POST - Submit a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const forumPostId = resolvedParams.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = commentSchema.parse(body);

    const client = await pool.connect();

    try {
      // Check if forum post exists and is active
      const forumQuery = `
        SELECT id, title
        FROM forum_posts
        WHERE id = $1 AND is_active = true
      `;
      const forumResult = await client.query(forumQuery, [forumPostId]);

      if (forumResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Forum post not found or not active' },
          { status: 404 }
        );
      }

      // Insert the comment
      const insertCommentQuery = `
        INSERT INTO forum_post_comments (post_id, user_id, comment, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id, comment, created_at
      `;

      const commentResult = await client.query(insertCommentQuery, [
        forumPostId,
        userId,
        validatedData.content
      ]);

      const newComment = commentResult.rows[0];

      // Get user info for the response
      const userQuery = `
        SELECT first_name, last_name, membership_number, user_role, profile_image_url, verification_status
        FROM users
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];

      return NextResponse.json({
        message: 'Comment submitted successfully',
        comment: {
          id: newComment.id,
          content: newComment.comment,
          createdAt: newComment.created_at,
          author: {
            id: userId,
            name: `${user.first_name} ${user.last_name}`,
            firstName: user.first_name,
            lastName: user.last_name,
            membershipNumber: user.membership_number,
            userRole: user.user_role,
            profileImageUrl: user.profile_image_url,
            verificationStatus: user.verification_status
          }
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Comment submission error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

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

// GET - Get comments for a forum post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const forumPostId = resolvedParams.id;

    // Get user ID from token for reaction status
    let currentUserId: string | null = null;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        currentUserId = decoded.userId;
      } catch (error) {
        // Invalid token, continue without user ID
      }
    }

    const client = await pool.connect();

    try {
      // Get comments with user information and like/dislike counts
      const commentsQuery = `
        SELECT
          c.id,
          c.comment as content,
          c.created_at,
          u.id as author_id,
          u.first_name,
          u.last_name,
          u.membership_number,
          u.user_role,
          u.profile_image_url,
          u.verification_status,
          COALESCE(like_counts.like_count, 0) as like_count,
          COALESCE(like_counts.dislike_count, 0) as dislike_count,
          user_reaction.is_like as user_reaction
        FROM forum_post_comments c
        INNER JOIN users u ON c.user_id = u.id
        LEFT JOIN (
          SELECT
            comment_id,
            COUNT(CASE WHEN is_like = true THEN 1 END) as like_count,
            COUNT(CASE WHEN is_like = false THEN 1 END) as dislike_count
          FROM forum_comment_likes
          GROUP BY comment_id
        ) like_counts ON c.id = like_counts.comment_id
        LEFT JOIN forum_comment_likes user_reaction ON c.id = user_reaction.comment_id AND user_reaction.user_id = $2
        WHERE c.post_id = $1 AND c.is_active = true
        ORDER BY c.created_at DESC
      `;

      const result = await client.query(commentsQuery, [forumPostId, currentUserId]);

      const comments = result.rows.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        likeCount: parseInt(comment.like_count) || 0,
        dislikeCount: parseInt(comment.dislike_count) || 0,
        userReaction: comment.user_reaction,
        author: {
          id: comment.author_id,
          name: `${comment.first_name} ${comment.last_name}`,
          firstName: comment.first_name,
          lastName: comment.last_name,
          membershipNumber: comment.membership_number,
          userRole: comment.user_role,
          profileImageUrl: comment.profile_image_url,
          verificationStatus: comment.verification_status
        }
      }));

      return NextResponse.json({
        comments,
        total: comments.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}