// app/api/forum/[id]/comments/[commentId]/route.ts - Handle individual comment operations
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

// Validation schema for comment update
const commentUpdateSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

// PUT - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const { id: forumPostId, commentId } = resolvedParams;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = commentUpdateSchema.parse(body);

    const client = await pool.connect();

    try {
      // Check if the comment exists and belongs to the user or user is admin
      const checkQuery = `
        SELECT c.user_id, u.user_role
        FROM forum_post_comments c
        LEFT JOIN users u ON u.id = $1
        WHERE c.id = $2 AND c.post_id = $3 AND c.is_active = true
      `;
      const checkResult = await client.query(checkQuery, [userId, commentId, forumPostId]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const { user_id: commentUserId, user_role } = checkResult.rows[0];

      // Check if user is the comment author or admin
      if (commentUserId !== userId && user_role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to edit this comment' },
          { status: 403 }
        );
      }

      // Update the comment
      const updateQuery = `
        UPDATE forum_post_comments
        SET comment = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING id, comment, updated_at
      `;

      const result = await client.query(updateQuery, [
        validatedData.content.trim(),
        commentId
      ]);

      const updatedComment = result.rows[0];

      return NextResponse.json({
        success: true,
        comment: {
          id: updatedComment.id,
          content: updatedComment.comment,
          updatedAt: updatedComment.updated_at
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Comment update error:', error);

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

// DELETE - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const { id: forumPostId, commentId } = resolvedParams;

    const client = await pool.connect();

    try {
      // Check if the comment exists and belongs to the user or user is admin
      const checkQuery = `
        SELECT c.user_id, u.user_role
        FROM forum_post_comments c
        LEFT JOIN users u ON u.id = $1
        WHERE c.id = $2 AND c.post_id = $3 AND c.is_active = true
      `;
      const checkResult = await client.query(checkQuery, [userId, commentId, forumPostId]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const { user_id: commentUserId, user_role } = checkResult.rows[0];

      // Check if user is the comment author or admin
      if (commentUserId !== userId && user_role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        );
      }

      // Soft delete the comment by setting is_active to false
      const deleteQuery = `
        UPDATE forum_post_comments
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `;

      const result = await client.query(deleteQuery, [commentId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Comment deletion error:', error);

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