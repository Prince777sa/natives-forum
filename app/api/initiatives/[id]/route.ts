// app/api/initiatives/[id]/route.ts - Get initiative details
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const initiativeId = resolvedParams.id;
    const client = await pool.connect();

    try {
      // Get initiative details with category and author info
      const initiativeQuery = `
        SELECT
          i.*,
          c.name as category_name,
          c.slug as category_slug,
          u.first_name || ' ' || u.last_name as author_name
        FROM initiatives i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.author_id = u.id
        WHERE i.id = $1
      `;

      const result = await client.query(initiativeQuery, [initiativeId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Initiative not found' },
          { status: 404 }
        );
      }

      const initiative = result.rows[0];

      // Get pledge statistics
      const pledgeStatsQuery = `
        SELECT
          COUNT(*) as total_pledges,
          SUM(amount) as total_amount,
          COUNT(DISTINCT user_id) as unique_pledgers
        FROM initiative_pledges
        WHERE initiative_id = $1
      `;

      const pledgeStatsResult = await client.query(pledgeStatsQuery, [initiativeId]);
      const pledgeStats = pledgeStatsResult.rows[0];

      // Format the response
      const response = {
        id: initiative.id,
        title: initiative.title,
        description: initiative.description,
        content: initiative.content,
        status: initiative.status,
        category: {
          name: initiative.category_name,
          slug: initiative.category_slug
        },
        author: initiative.author_name,
        targetParticipants: initiative.target_participants,
        currentParticipants: parseInt(initiative.current_participants) || 0,
        targetAmount: parseFloat(initiative.target_amount) || 0,
        currentAmount: parseFloat(initiative.current_amount) || 0,
        startDate: initiative.start_date,
        endDate: initiative.end_date,
        featured: initiative.featured,
        createdAt: initiative.created_at,
        updatedAt: initiative.updated_at,
        pledgeStats: {
          totalPledges: parseInt(pledgeStats.total_pledges) || 0,
          totalAmount: parseFloat(pledgeStats.total_amount) || 0,
          uniquePledgers: parseInt(pledgeStats.unique_pledgers) || 0
        }
      };

      return NextResponse.json(response);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get initiative error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}