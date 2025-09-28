// app/api/forum/route.ts - Get all forum posts and create new ones
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
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

    const client = await pool.connect();

    try {
      // Get all forum posts with like/dislike counts, comment counts, and user reactions
      const forumQuery = `
        SELECT
          fp.*,
          u.id as author_id,
          u.first_name,
          u.last_name,
          u.membership_number,
          u.user_role,
          u.profile_image_url,
          u.verification_status,
          COALESCE(like_counts.like_count, 0) as like_count,
          COALESCE(like_counts.dislike_count, 0) as dislike_count,
          COALESCE(comments.count, 0) as comment_count,
          user_reaction.is_like as user_reaction
        FROM forum_posts fp
        LEFT JOIN users u ON fp.author_id = u.id
        LEFT JOIN (
          SELECT
            post_id,
            COUNT(CASE WHEN is_like = true THEN 1 END) as like_count,
            COUNT(CASE WHEN is_like = false THEN 1 END) as dislike_count
          FROM forum_post_likes
          GROUP BY post_id
        ) like_counts ON fp.id = like_counts.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as count
          FROM forum_post_comments
          WHERE is_active = true
          GROUP BY post_id
        ) comments ON fp.id = comments.post_id
        LEFT JOIN (
          SELECT post_id, is_like
          FROM forum_post_likes
          WHERE user_id = $1
        ) user_reaction ON fp.id = user_reaction.post_id
        WHERE fp.is_active = true AND u.is_active = true
        ORDER BY fp.created_at DESC
      `;

      const result = await client.query(forumQuery, [currentUserId]);

      // Format the response
      const forumPosts = result.rows.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        author: {
          id: post.author_id,
          name: `${post.first_name} ${post.last_name}`,
          firstName: post.first_name,
          lastName: post.last_name,
          membershipNumber: post.membership_number,
          userRole: post.user_role,
          profileImageUrl: post.profile_image_url,
          verificationStatus: post.verification_status
        },
        likeCount: parseInt(post.like_count) || 0,
        dislikeCount: parseInt(post.dislike_count) || 0,
        commentCount: parseInt(post.comment_count) || 0,
        userReaction: post.user_reaction,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      }));

      return NextResponse.json({
        posts: forumPosts,
        total: forumPosts.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get forum posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/forum - Create a new forum post
export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get request body
    const { title, content } = await request.json();

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Insert new forum post
      const insertQuery = `
        INSERT INTO forum_posts (
          title, content, author_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, title, content, created_at, updated_at
      `;

      const result = await client.query(insertQuery, [
        title.trim(),
        content.trim(),
        userId
      ]);

      const newPost = result.rows[0];

      // Get user details for the response
      const userQuery = `
        SELECT id, first_name, last_name, membership_number, user_role, profile_image_url, verification_status
        FROM users
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];

      return NextResponse.json({
        success: true,
        post: {
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          excerpt: content.length > 300 ? content.substring(0, 300) + '...' : content,
          author: {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            firstName: user.first_name,
            lastName: user.last_name,
            membershipNumber: user.membership_number,
            userRole: user.user_role,
            profileImageUrl: user.profile_image_url,
            verificationStatus: user.verification_status
          },
          likeCount: 0,
          dislikeCount: 0,
          commentCount: 0,
          userReaction: null,
          createdAt: newPost.created_at,
          updatedAt: newPost.updated_at
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create forum post error:', error);
    return NextResponse.json(
      { error: 'Failed to create forum post' },
      { status: 500 }
    );
  }
}