// app/api/forum/[slug]/comments/route.ts - Handle forum post comments by slug
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';

interface JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;

// Validation schema for comment submission
const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

// POST - Submit a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = commentSchema.parse(body);

    const client = await pool.connect();

    try {
      // Check if forum post exists and is active, get ID
      const forumQuery = `
        SELECT id, title, author_id
        FROM forum_posts
        WHERE slug = $1 AND is_active = true
      `;
      const forumResult = await client.query(forumQuery, [slug]);

      if (forumResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Forum post not found' },
          { status: 404 }
        );
      }

      const forumPostId = forumResult.rows[0].id;

      // Insert the comment
      const insertQuery = `
        INSERT INTO forum_post_comments (
          post_id,
          user_id,
          comment,
          created_at
        )
        VALUES ($1, $2, $3, NOW())
        RETURNING id, comment as content, created_at
      `;

      const result = await client.query(insertQuery, [
        forumPostId,
        userId,
        validatedData.content,
      ]);

      const newComment = result.rows[0];

      // Get user details for the response
      const userQuery = `
        SELECT
          id,
          first_name,
          last_name,
          membership_number,
          user_role,
          profile_image_url,
          verification_status
        FROM users
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];

      // Return the created comment with user details
      return NextResponse.json({
        success: true,
        comment: {
          id: newComment.id,
          content: newComment.content,
          createdAt: newComment.created_at,
          likeCount: 0,
          dislikeCount: 0,
          userReaction: null,
          author: {
            id: user.id,
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
        { error: error.issues[0].message },
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

// GET - Retrieve comments for a forum post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    // Get user ID for personalized reactions (optional)
    let currentUserId = null;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        currentUserId = decoded.userId;
      } catch {
        // Invalid token, continue without user data
      }
    }

    const client = await pool.connect();

    try {
      // First check if forum post exists
      const postQuery = `
        SELECT id FROM forum_posts
        WHERE slug = $1 AND is_active = true
      `;
      const postResult = await client.query(postQuery, [slug]);

      if (postResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Forum post not found' },
          { status: 404 }
        );
      }

      const forumPostId = postResult.rows[0].id;

      // Get all comments with user details and reaction counts
      const commentsQuery = `
        SELECT
          fpc.id,
          fpc.comment as content,
          fpc.created_at,
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
        FROM forum_post_comments fpc
        LEFT JOIN users u ON fpc.user_id = u.id
        LEFT JOIN (
          SELECT
            comment_id,
            COUNT(CASE WHEN is_like = true THEN 1 END) as like_count,
            COUNT(CASE WHEN is_like = false THEN 1 END) as dislike_count
          FROM forum_comment_likes
          GROUP BY comment_id
        ) like_counts ON fpc.id = like_counts.comment_id
        LEFT JOIN (
          SELECT comment_id, is_like
          FROM forum_comment_likes
          WHERE user_id = $2
        ) user_reaction ON fpc.id = user_reaction.comment_id
        WHERE fpc.post_id = $1 AND fpc.is_active = true AND u.is_active = true
        ORDER BY fpc.created_at DESC
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