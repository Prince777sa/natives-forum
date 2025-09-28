import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

// PUT /api/initiatives/comments/[commentId] - Edit a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
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
      // Check if comment exists and user owns it (or user is admin/staff)
      const commentCheckQuery = `
        SELECT ic.user_id, u.user_role
        FROM initiative_comments ic
        JOIN users u ON ic.user_id = u.id
        WHERE ic.id = $1 AND ic.is_active = true
      `;
      const commentResult = await client.query(commentCheckQuery, [commentId]);

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const comment_owner_id = commentResult.rows[0].user_id;

      // Get current user's role
      const userRoleQuery = 'SELECT user_role FROM users WHERE id = $1';
      const userRoleResult = await client.query(userRoleQuery, [userId]);
      const currentUserRole = userRoleResult.rows[0]?.user_role;

      // Check if user can edit this comment (owner, admin, or staff)
      const canEdit = comment_owner_id === userId ||
                     currentUserRole === 'admin' ||
                     currentUserRole === 'staff';

      if (!canEdit) {
        return NextResponse.json(
          { error: 'You can only edit your own comments' },
          { status: 403 }
        );
      }

      // Update the comment
      const updateQuery = `
        UPDATE initiative_comments
        SET comment = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING comment, updated_at
      `;

      const result = await client.query(updateQuery, [comment.trim(), commentId]);

      return NextResponse.json({
        success: true,
        comment: result.rows[0].comment,
        updated_at: result.rows[0].updated_at
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating comment:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/initiatives/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;

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

    const client = await pool.connect();

    try {
      // Check if comment exists and user owns it (or user is admin/staff)
      const commentCheckQuery = `
        SELECT ic.user_id, u.user_role
        FROM initiative_comments ic
        JOIN users u ON ic.user_id = u.id
        WHERE ic.id = $1 AND ic.is_active = true
      `;
      const commentResult = await client.query(commentCheckQuery, [commentId]);

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const comment_owner_id = commentResult.rows[0].user_id;

      // Get current user's role
      const userRoleQuery = 'SELECT user_role FROM users WHERE id = $1';
      const userRoleResult = await client.query(userRoleQuery, [userId]);
      const currentUserRole = userRoleResult.rows[0]?.user_role;

      // Check if user can delete this comment (owner, admin, or staff)
      const canDelete = comment_owner_id === userId ||
                       currentUserRole === 'admin' ||
                       currentUserRole === 'staff';

      if (!canDelete) {
        return NextResponse.json(
          { error: 'You can only delete your own comments' },
          { status: 403 }
        );
      }

      // Soft delete the comment
      const deleteQuery = `
        UPDATE initiative_comments
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await client.query(deleteQuery, [commentId]);

      return NextResponse.json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting comment:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}