// app/api/events/route.ts - Get all events
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Get all events with RSVP counts and comment counts
      const eventsQuery = `
        SELECT
          e.*,
          u.first_name || ' ' || u.last_name as organizer_name,
          u.membership_number as organizer_membership,
          COALESCE(rsvps.count, 0) as rsvp_count,
          COALESCE(comments.count, 0) as comment_count
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        LEFT JOIN (
          SELECT event_id, COUNT(*) as count
          FROM event_rsvps
          WHERE status = 'attending'
          GROUP BY event_id
        ) rsvps ON e.id = rsvps.event_id
        LEFT JOIN (
          SELECT event_id, COUNT(*) as count
          FROM event_comments
          GROUP BY event_id
        ) comments ON e.id = comments.event_id
        WHERE e.status = 'active'
        ORDER BY e.event_date ASC
      `;

      const result = await client.query(eventsQuery);

      // Format the response
      const events = result.rows.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        eventDate: event.event_date,
        endDate: event.end_date,
        maxAttendees: event.max_attendees,
        status: event.status,
        organizer: {
          name: event.organizer_name,
          membershipNumber: event.organizer_membership
        },
        rsvpCount: parseInt(event.rsvp_count) || 0,
        commentCount: parseInt(event.comment_count) || 0,
        createdAt: event.created_at,
        updatedAt: event.updated_at
      }));

      return NextResponse.json({
        events,
        total: events.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}