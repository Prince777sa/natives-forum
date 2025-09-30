import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/groups/[slug]/posts - Get all posts for a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const client = await pool.connect();

    try {
      // Get group ID from slug
      const groupResult = await client.query(
        'SELECT id FROM groups WHERE slug = $1 AND is_active = true',
        [slug]
      );

      if (groupResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }

      const groupId = groupResult.rows[0].id;

      // Get posts with author info and comment count
      const postsQuery = `
        SELECT
          gp.id,
          gp.title,
          gp.content,
          gp.post_type,
          gp.event_date,
          gp.event_location,
          gp.is_pinned,
          gp.created_at,
          gp.updated_at,
          u.id as author_id,
          u.first_name,
          u.last_name,
          u.membership_number,
          u.profile_image_url,
          u.user_role,
          (SELECT COUNT(*) FROM group_post_comments gpc
           WHERE gpc.post_id = gp.id AND gpc.is_active = true) as comment_count
        FROM group_posts gp
        JOIN users u ON gp.author_id = u.id
        WHERE gp.group_id = $1 AND gp.is_active = true
        ORDER BY gp.is_pinned DESC, gp.created_at DESC
      `;

      const postsResult = await client.query(postsQuery, [groupId]);

      const posts = postsResult.rows.map(row => ({
        id: row.id.toString(),
        title: row.title,
        content: row.content,
        postType: row.post_type,
        eventDate: row.event_date,
        eventLocation: row.event_location,
        isPinned: row.is_pinned,
        author: {
          id: row.author_id.toString(),
          firstName: row.first_name,
          lastName: row.last_name,
          membershipNumber: row.membership_number,
          profileImageUrl: row.profile_image_url,
          userRole: row.user_role,
        },
        commentCount: parseInt(row.comment_count),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return NextResponse.json({ posts });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching group posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/groups/[slug]/posts - Create a new post in a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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
      // Get group ID from slug
      const groupResult = await client.query(
        'SELECT id FROM groups WHERE slug = $1 AND is_active = true',
        [slug]
      );

      if (groupResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }

      const groupId = groupResult.rows[0].id;

      // Check if user is a member
      const memberCheck = await client.query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND is_active = true',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Only branch members can create posts' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { title, content, postType, eventDate, eventLocation, isPinned } = body;

      if (!title || !content || !postType) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Only leaders and moderators can pin posts
      const userRole = memberCheck.rows[0].role;
      const canPin = userRole === 'leader' || userRole === 'moderator';
      const finalIsPinned = canPin && isPinned ? true : false;

      // Create post
      const result = await client.query(
        `INSERT INTO group_posts
         (group_id, author_id, title, content, post_type, event_date, event_location, is_pinned)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, title, content, post_type, event_date, event_location, is_pinned, created_at`,
        [groupId, userId, title, content, postType, eventDate || null, eventLocation || null, finalIsPinned]
      );

      const post = result.rows[0];

      // Get author info
      const authorInfo = await client.query(
        'SELECT first_name, last_name, membership_number, profile_image_url, user_role FROM users WHERE id = $1',
        [userId]
      );

      return NextResponse.json({
        post: {
          id: post.id.toString(),
          title: post.title,
          content: post.content,
          postType: post.post_type,
          eventDate: post.event_date,
          eventLocation: post.event_location,
          isPinned: post.is_pinned,
          author: {
            id: userId,
            firstName: authorInfo.rows[0].first_name,
            lastName: authorInfo.rows[0].last_name,
            membershipNumber: authorInfo.rows[0].membership_number,
            profileImageUrl: authorInfo.rows[0].profile_image_url,
            userRole: authorInfo.rows[0].user_role,
          },
          commentCount: 0,
          createdAt: post.created_at,
          updatedAt: post.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating group post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
