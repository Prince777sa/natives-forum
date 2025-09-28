// app/api/polls/[id]/vote/route.ts - Handle poll voting
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

// Validation schema for vote submission
const voteSchema = z.object({
  voteType: z.enum(['up', 'down'], {
    message: 'Vote type must be up or down',
  }),
});

// POST - Submit or update a vote
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

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const pollId = resolvedParams.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = voteSchema.parse(body);

    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if poll exists and is active
      const pollQuery = `
        SELECT id, title, status
        FROM polls
        WHERE id = $1 AND status = 'active'
      `;
      const pollResult = await client.query(pollQuery, [pollId]);

      if (pollResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Poll not found or not active' },
          { status: 404 }
        );
      }

      // Check if user has already voted on this poll
      const existingVoteQuery = `
        SELECT id, vote_type FROM poll_votes
        WHERE poll_id = $1 AND user_id = $2
      `;
      const existingVoteResult = await client.query(existingVoteQuery, [pollId, userId]);

      if (existingVoteResult.rows.length > 0) {
        const existingVote = existingVoteResult.rows[0];

        if (existingVote.vote_type === validatedData.voteType) {
          // User is clicking the same vote type - remove the vote
          await client.query('DELETE FROM poll_votes WHERE id = $1', [existingVote.id]);
        } else {
          // User is changing their vote
          await client.query(
            'UPDATE poll_votes SET vote_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [validatedData.voteType, existingVote.id]
          );
        }
      } else {
        // User is voting for the first time
        await client.query(
          `INSERT INTO poll_votes (poll_id, user_id, vote_type, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [pollId, userId, validatedData.voteType]
        );
      }

      // Get updated vote counts
      const voteCountsQuery = `
        SELECT
          COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
          COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
        FROM poll_votes
        WHERE poll_id = $1
      `;
      const voteCountsResult = await client.query(voteCountsQuery, [pollId]);
      const voteCounts = voteCountsResult.rows[0];

      // Get user's current vote
      const userVoteQuery = `
        SELECT vote_type FROM poll_votes
        WHERE poll_id = $1 AND user_id = $2
      `;
      const userVoteResult = await client.query(userVoteQuery, [pollId, userId]);
      const userVote = userVoteResult.rows[0]?.vote_type || null;

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Vote submitted successfully',
        upvotes: parseInt(voteCounts.upvotes) || 0,
        downvotes: parseInt(voteCounts.downvotes) || 0,
        userVote: userVote
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Vote submission error:', error);

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

// GET - Get user's vote for a poll
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ userVote: null });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const pollId = resolvedParams.id;

    const client = await pool.connect();

    try {
      // Get user's vote for this poll
      const userVoteQuery = `
        SELECT vote_type FROM poll_votes
        WHERE poll_id = $1 AND user_id = $2
      `;
      const userVoteResult = await client.query(userVoteQuery, [pollId, userId]);
      const userVote = userVoteResult.rows[0]?.vote_type || null;

      return NextResponse.json({ userVote });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get user vote error:', error);
    return NextResponse.json({ userVote: null });
  }
}