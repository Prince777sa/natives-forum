// app/api/events/[id]/rsvp/route.ts - Handle event RSVPs
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

interface JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

// Validation schema for RSVP submission
const rsvpSchema = z.object({
  status: z.enum(['attending', 'not_attending', 'maybe'], {
    message: 'RSVP status must be attending, not_attending, or maybe',
  }),
});

// POST - Submit or update an RSVP
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

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = rsvpSchema.parse(body);

    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if event exists and is active
      const eventQuery = `
        SELECT id, title, status, max_attendees, event_date
        FROM events
        WHERE id = $1 AND status = 'active'
      `;
      const eventResult = await client.query(eventQuery, [eventId]);

      if (eventResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Event not found or not active' },
          { status: 404 }
        );
      }

      const event = eventResult.rows[0];

      // Check if event has already passed
      if (new Date(event.event_date) < new Date()) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Cannot RSVP to past events' },
          { status: 400 }
        );
      }

      // Check if user has already RSVPed
      const existingRsvpQuery = `
        SELECT id, status FROM event_rsvps
        WHERE event_id = $1 AND user_id = $2
      `;
      const existingRsvpResult = await client.query(existingRsvpQuery, [eventId, userId]);

      if (existingRsvpResult.rows.length > 0) {
        // Update existing RSVP
        await client.query(
          'UPDATE event_rsvps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [validatedData.status, existingRsvpResult.rows[0].id]
        );
      } else {
        // Create new RSVP
        await client.query(
          `INSERT INTO event_rsvps (event_id, user_id, status, created_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [eventId, userId, validatedData.status]
        );
      }

      // Get updated RSVP counts
      const rsvpCountsQuery = `
        SELECT
          COUNT(CASE WHEN status = 'attending' THEN 1 END) as attending,
          COUNT(CASE WHEN status = 'maybe' THEN 1 END) as maybe,
          COUNT(CASE WHEN status = 'not_attending' THEN 1 END) as not_attending
        FROM event_rsvps
        WHERE event_id = $1
      `;
      const rsvpCountsResult = await client.query(rsvpCountsQuery, [eventId]);
      const rsvpCounts = rsvpCountsResult.rows[0];

      // Check if event is now full
      const attendingCount = parseInt(rsvpCounts.attending) || 0;
      const isEventFull = event.max_attendees && attendingCount >= event.max_attendees;

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'RSVP submitted successfully',
        rsvpCounts: {
          attending: attendingCount,
          maybe: parseInt(rsvpCounts.maybe) || 0,
          notAttending: parseInt(rsvpCounts.not_attending) || 0
        },
        userRsvp: validatedData.status,
        isEventFull: isEventFull
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('RSVP submission error:', error);

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

// GET - Get user's RSVP for an event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ userRsvp: null });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    const client = await pool.connect();

    try {
      // Get user's RSVP for this event
      const userRsvpQuery = `
        SELECT status FROM event_rsvps
        WHERE event_id = $1 AND user_id = $2
      `;
      const userRsvpResult = await client.query(userRsvpQuery, [eventId, userId]);
      const userRsvp = userRsvpResult.rows[0]?.status || null;

      return NextResponse.json({ userRsvp });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get user RSVP error:', error);
    return NextResponse.json({ userRsvp: null });
  }
}