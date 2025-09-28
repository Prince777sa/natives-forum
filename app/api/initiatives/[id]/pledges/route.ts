// app/api/initiatives/[id]/pledges/route.ts - Handle initiative pledges
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

// Validation schema for pledge submission
const pledgeSchema = z.object({
  amount: z.number().min(1200, 'Minimum pledge amount is R1,200'),
  province: z.string().min(1, 'Province is required'),
  additionalPledges: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    amount: z.number().min(1200, 'Minimum pledge amount is R1,200'),
    province: z.string().min(1, 'Province is required'),
    gender: z.enum(['male', 'female', 'other'], {
      message: 'Gender is required',
    }),
  })).default([]),
});

// POST - Submit a pledge
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
    const initiativeId = resolvedParams.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = pledgeSchema.parse(body);

    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if initiative exists and is active
      const initiativeQuery = `
        SELECT id, title, status, target_amount, current_amount, current_participants
        FROM initiatives
        WHERE id = $1 AND status = 'active'
      `;
      const initiativeResult = await client.query(initiativeQuery, [initiativeId]);

      if (initiativeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Initiative not found or not active' },
          { status: 404 }
        );
      }

      const initiative = initiativeResult.rows[0];

      // Check if user has already pledged for this initiative
      const existingPledgeQuery = `
        SELECT id FROM initiative_pledges
        WHERE initiative_id = $1 AND user_id = $2
      `;
      const existingPledgeResult = await client.query(existingPledgeQuery, [initiativeId, userId]);

      if (existingPledgeResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'You have already made a pledge for this initiative' },
          { status: 400 }
        );
      }

      // Get user information for the main pledge
      const userQuery = `
        SELECT first_name, last_name, province as user_province
        FROM users
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [userId]);
      const user = userResult.rows[0];

      // Create main pledge
      const mainPledgeQuery = `
        INSERT INTO initiative_pledges (
          initiative_id, user_id, amount, beneficiary_name, beneficiary_relationship,
          beneficiary_gender, province, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING id, amount
      `;

      const mainPledgeResult = await client.query(mainPledgeQuery, [
        initiativeId,
        userId,
        validatedData.amount,
        `${user.first_name} ${user.last_name}`,
        'self',
        null, // User's gender not specified in main pledge
        validatedData.province
      ]);

      const mainPledge = mainPledgeResult.rows[0];
      let totalPledgeAmount = validatedData.amount;
      let totalPledgeCount = 1;

      // Create additional pledges
      for (const additionalPledge of validatedData.additionalPledges) {
        const additionalPledgeQuery = `
          INSERT INTO initiative_pledges (
            initiative_id, user_id, amount, beneficiary_name, beneficiary_relationship,
            beneficiary_gender, province, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
          RETURNING id, amount
        `;

        await client.query(additionalPledgeQuery, [
          initiativeId,
          userId,
          additionalPledge.amount,
          additionalPledge.name,
          additionalPledge.relationship,
          additionalPledge.gender,
          additionalPledge.province
        ]);

        totalPledgeAmount += additionalPledge.amount;
        totalPledgeCount += 1;
      }

      // Update initiative statistics
      const newCurrentAmount = parseFloat(initiative.current_amount) + totalPledgeAmount;
      const newCurrentParticipants = initiative.current_participants + totalPledgeCount;

      const updateInitiativeQuery = `
        UPDATE initiatives
        SET current_amount = $1, current_participants = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `;

      await client.query(updateInitiativeQuery, [
        newCurrentAmount,
        newCurrentParticipants,
        initiativeId
      ]);

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Pledge submitted successfully',
        pledge: {
          id: mainPledge.id,
          totalAmount: totalPledgeAmount,
          totalPledges: totalPledgeCount,
          initiative: {
            id: initiative.id,
            title: initiative.title,
            newCurrentAmount: newCurrentAmount,
            newCurrentParticipants: newCurrentParticipants
          }
        }
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Pledge submission error:', error);

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

// GET - Get pledges for an initiative
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const initiativeId = resolvedParams.id;
    const client = await pool.connect();

    try {
      // Get pledge statistics
      const statsQuery = `
        SELECT
          COUNT(*) as total_pledges,
          SUM(amount) as total_amount,
          COUNT(DISTINCT user_id) as unique_pledgers,
          COUNT(CASE WHEN beneficiary_gender = 'male' THEN 1 END) as male_pledges,
          COUNT(CASE WHEN beneficiary_gender = 'female' THEN 1 END) as female_pledges
        FROM initiative_pledges
        WHERE initiative_id = $1
      `;

      const statsResult = await client.query(statsQuery, [initiativeId]);
      const stats = statsResult.rows[0];

      // Get pledge breakdown by province
      const provinceQuery = `
        SELECT
          province,
          COUNT(*) as pledge_count,
          SUM(amount) as province_amount
        FROM initiative_pledges
        WHERE initiative_id = $1
        GROUP BY province
        ORDER BY province_amount DESC
      `;

      const provinceResult = await client.query(provinceQuery, [initiativeId]);

      return NextResponse.json({
        stats: {
          totalPledges: parseInt(stats.total_pledges) || 0,
          totalAmount: parseFloat(stats.total_amount) || 0,
          uniquePledgers: parseInt(stats.unique_pledgers) || 0,
          malePledges: parseInt(stats.male_pledges) || 0,
          femalePledges: parseInt(stats.female_pledges) || 0,
        },
        provinceBreakdown: provinceResult.rows
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get pledges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}