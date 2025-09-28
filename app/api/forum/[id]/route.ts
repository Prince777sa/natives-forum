import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

// GET /api/forum/[id] - Get a single forum post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: postId } = resolvedParams;

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
      // Get the forum post with like/dislike counts, comment counts, and user reactions
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
        WHERE fp.id = $2 AND fp.is_active = true AND u.is_active = true
      `;

      const result = await client.query(forumQuery, [currentUserId, postId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      const post = result.rows[0];

      // Format the response
      const forumPost = {
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
      };

      return NextResponse.json({
        post: forumPost
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get forum post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/forum/[id] - Update a forum post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const { id: postId } = resolvedParams;
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
      // Check if the post exists and if the user is the author or admin
      const checkQuery = `
        SELECT fp.author_id, u.user_role
        FROM forum_posts fp
        LEFT JOIN users u ON u.id = $2
        WHERE fp.id = $1 AND fp.is_active = true
      `;
      const checkResult = await client.query(checkQuery, [postId, userId]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      const { author_id, user_role } = checkResult.rows[0];

      // Check if user is the author or admin
      if (author_id !== userId && user_role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to edit this post' },
          { status: 403 }
        );
      }

      // Update the post
      const updateQuery = `
        UPDATE forum_posts
        SET title = $1, content = $2, updated_at = NOW()
        WHERE id = $3 AND is_active = true
        RETURNING id, title, content, updated_at
      `;

      const result = await client.query(updateQuery, [
        title.trim(),
        content.trim(),
        postId
      ]);

      const updatedPost = result.rows[0];

      return NextResponse.json({
        success: true,
        post: {
          id: updatedPost.id,
          title: updatedPost.title,
          content: updatedPost.content,
          updatedAt: updatedPost.updated_at
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update forum post error:', error);
    return NextResponse.json(
      { error: 'Failed to update forum post' },
      { status: 500 }
    );
  }
}

// DELETE /api/forum/[id] - Delete a forum post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const { id: postId } = resolvedParams;
    const client = await pool.connect();

    try {
      // Check if the post exists and if the user is the author or admin
      const checkQuery = `
        SELECT fp.author_id, u.user_role
        FROM forum_posts fp
        LEFT JOIN users u ON u.id = $2
        WHERE fp.id = $1 AND fp.is_active = true
      `;
      const checkResult = await client.query(checkQuery, [postId, userId]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      const { author_id, user_role } = checkResult.rows[0];

      // Check if user is the author or admin
      if (author_id !== userId && user_role !== 'admin') {
        return NextResponse.json(
          { error: 'Not authorized to delete this post' },
          { status: 403 }
        );
      }

      // Soft delete the post by setting is_active to false
      const deleteQuery = `
        UPDATE forum_posts
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `;

      const result = await client.query(deleteQuery, [postId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Post deleted successfully'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Delete forum post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete forum post' },
      { status: 500 }
    );
  }
}