// app/api/forum/[slug]/comments/[commentId]/route.ts - Edit and delete specific comments
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET!;

// PUT - Edit a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
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
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment content too long' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // First, get the post ID from slug
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

      const postId = postResult.rows[0].id;

      // Check if comment exists and user can edit it
      const commentQuery = `
        SELECT fpc.user_id, u.user_role
        FROM forum_post_comments fpc
        LEFT JOIN users u ON u.id = $2
        WHERE fpc.id = $1 AND fpc.post_id = $3 AND fpc.is_active = true
      `;
      const commentResult = await client.query(commentQuery, [commentId, userId, postId]);

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const { user_id: commentUserId, user_role } = commentResult.rows[0];

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
        SET comment = $1, updated_at = NOW()
        WHERE id = $2 AND is_active = true
        RETURNING id, comment as content, updated_at
      `;

      const result = await client.query(updateQuery, [content.trim(), commentId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Failed to update comment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        comment: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Edit comment error:', error);

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
  { params }: { params: Promise<{ slug: string; commentId: string }> }
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

    const client = await pool.connect();

    try {
      // First, get the post ID from slug
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

      const postId = postResult.rows[0].id;

      // Check if comment exists and user can delete it
      const commentQuery = `
        SELECT fpc.user_id, u.user_role
        FROM forum_post_comments fpc
        LEFT JOIN users u ON u.id = $2
        WHERE fpc.id = $1 AND fpc.post_id = $3 AND fpc.is_active = true
      `;
      const commentResult = await client.query(commentQuery, [commentId, userId, postId]);

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const { user_id: commentUserId, user_role } = commentResult.rows[0];

      // Check if user is the comment author or admin
      if (commentUserId !== userId && user_role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        );
      }

      // Soft delete the comment
      const deleteQuery = `
        UPDATE forum_post_comments
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `;

      const result = await client.query(deleteQuery, [commentId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Failed to delete comment' },
          { status: 500 }
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
    console.error('Delete comment error:', error);

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