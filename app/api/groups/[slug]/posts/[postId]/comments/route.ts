import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/groups/[slug]/posts/[postId]/comments - Get all comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const client = await pool.connect();

    try {
      // Get all comments with author info
      const result = await client.query(
        `SELECT
          gpc.id,
          gpc.comment as content,
          gpc.created_at,
          gpc.updated_at,
          u.id as author_id,
          u.first_name,
          u.last_name,
          u.membership_number,
          u.profile_image_url,
          u.user_role,
          u.verification_status
         FROM group_post_comments gpc
         JOIN users u ON gpc.user_id = u.id
         WHERE gpc.post_id = $1 AND gpc.is_active = true
         ORDER BY gpc.created_at DESC`,
        [postId]
      );

      const comments = result.rows.map(row => ({
        id: row.id.toString(),
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        author: {
          id: row.author_id,
          firstName: row.first_name,
          lastName: row.last_name,
          name: `${row.first_name} ${row.last_name}`,
          membershipNumber: row.membership_number,
          profileImageUrl: row.profile_image_url,
          userRole: row.user_role,
          verificationStatus: row.verification_status,
        },
      }));

      return NextResponse.json({ comments });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/groups/[slug]/posts/[postId]/comments - Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if post exists
      const postCheck = await client.query(
        'SELECT id FROM group_posts WHERE id = $1 AND is_active = true',
        [postId]
      );

      if (postCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      // Create comment
      const result = await client.query(
        `INSERT INTO group_post_comments (post_id, user_id, comment)
         VALUES ($1, $2, $3)
         RETURNING id, comment as content, created_at`,
        [postId, userId, content.trim()]
      );

      const comment = result.rows[0];

      // Get author info
      const authorInfo = await client.query(
        `SELECT id, first_name, last_name, membership_number, profile_image_url, user_role, verification_status
         FROM users WHERE id = $1`,
        [userId]
      );

      const author = authorInfo.rows[0];

      return NextResponse.json({
        comment: {
          id: comment.id.toString(),
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.created_at,
          author: {
            id: author.id,
            firstName: author.first_name,
            lastName: author.last_name,
            name: `${author.first_name} ${author.last_name}`,
            membershipNumber: author.membership_number,
            profileImageUrl: author.profile_image_url,
            userRole: author.user_role,
            verificationStatus: author.verification_status,
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
