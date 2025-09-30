import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// DELETE /api/groups/[slug]/posts/[postId]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const client = await pool.connect();

    try {
      // Check if comment exists and if user has permission
      const commentCheck = await client.query(
        `SELECT gpc.user_id, gp.group_id, g.leader_id, u.user_role
         FROM group_post_comments gpc
         JOIN group_posts gp ON gpc.post_id = gp.id
         JOIN groups g ON gp.group_id = g.id
         JOIN users u ON u.id = $2
         WHERE gpc.id = $1 AND gpc.is_active = true`,
        [commentId, userId]
      );

      if (commentCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const { user_id: commentAuthorId, leader_id, user_role } = commentCheck.rows[0];

      // Only comment author, group leader, or admin can delete
      if (commentAuthorId !== userId && leader_id !== userId && user_role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have permission to delete this comment' },
          { status: 403 }
        );
      }

      // Soft delete the comment
      await client.query(
        'UPDATE group_post_comments SET is_active = false WHERE id = $1',
        [commentId]
      );

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
