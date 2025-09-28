// app/api/events/[id]/comments/route.ts - Handle event comments
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
    const eventId = resolvedParams.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = commentSchema.parse(body);

    const client = await pool.connect();

    try {
      // Check if event exists and is active
      const eventQuery = `
        SELECT id, title, status
        FROM events
        WHERE id = $1 AND status = 'active'
      `;
      const eventResult = await client.query(eventQuery, [eventId]);

      if (eventResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Event not found or not active' },
          { status: 404 }
        );
      }

      // Insert the comment
      const insertCommentQuery = `
        INSERT INTO event_comments (event_id, user_id, content, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id, content, created_at
      `;

      const commentResult = await client.query(insertCommentQuery, [
        eventId,
        userId,
        validatedData.content
      ]);

      const newComment = commentResult.rows[0];

      // Get user info for the response
      const userQuery = `
        SELECT first_name, last_name, membership_number
        FROM users
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];

      return NextResponse.json({
        message: 'Comment submitted successfully',
        comment: {
          id: newComment.id,
          content: newComment.content,
          createdAt: newComment.created_at,
          author: {
            name: `${user.first_name} ${user.last_name}`,
            membershipNumber: user.membership_number
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

// GET - Get comments for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const client = await pool.connect();

    try {
      // Get comments with user information
      const commentsQuery = `
        SELECT
          c.id,
          c.content,
          c.created_at,
          u.first_name || ' ' || u.last_name as author_name,
          u.membership_number
        FROM event_comments c
        INNER JOIN users u ON c.user_id = u.id
        WHERE c.event_id = $1
        ORDER BY c.created_at DESC
      `;

      const result = await client.query(commentsQuery, [eventId]);

      const comments = result.rows.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          name: comment.author_name,
          membershipNumber: comment.membership_number
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