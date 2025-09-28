// app/api/polls/route.ts - Get all polls
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Get all polls with vote counts and user interaction info
      const pollsQuery = `
        SELECT
          p.*,
          u.first_name || ' ' || u.last_name as author_name,
          COALESCE(upvotes.count, 0) as upvotes,
          COALESCE(downvotes.count, 0) as downvotes,
          COALESCE(comments.count, 0) as comment_count
        FROM polls p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN (
          SELECT poll_id, COUNT(*) as count
          FROM poll_votes
          WHERE vote_type = 'up'
          GROUP BY poll_id
        ) upvotes ON p.id = upvotes.poll_id
        LEFT JOIN (
          SELECT poll_id, COUNT(*) as count
          FROM poll_votes
          WHERE vote_type = 'down'
          GROUP BY poll_id
        ) downvotes ON p.id = downvotes.poll_id
        LEFT JOIN (
          SELECT poll_id, COUNT(*) as count
          FROM poll_comments
          GROUP BY poll_id
        ) comments ON p.id = comments.poll_id
        WHERE p.status = 'active'
        ORDER BY p.created_at DESC
      `;

      const result = await client.query(pollsQuery);

      // Format the response
      const polls = result.rows.map(poll => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        content: poll.content,
        status: poll.status,
        author: poll.author_name,
        upvotes: parseInt(poll.upvotes) || 0,
        downvotes: parseInt(poll.downvotes) || 0,
        commentCount: parseInt(poll.comment_count) || 0,
        totalVotes: (parseInt(poll.upvotes) || 0) + (parseInt(poll.downvotes) || 0),
        createdAt: poll.created_at,
        updatedAt: poll.updated_at
      }));

      return NextResponse.json({
        polls,
        total: polls.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get polls error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}