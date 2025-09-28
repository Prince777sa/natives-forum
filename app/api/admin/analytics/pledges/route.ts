// app/api/admin/analytics/pledges/route.ts - Pledge analytics for admin
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

interface JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new Error('Authentication required');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  const adminUserId = decoded.userId;

  const client = await pool.connect();
  try {
    const adminQuery = `SELECT email FROM users WHERE id = $1`;
    const adminResult = await client.query(adminQuery, [adminUserId]);

    if (adminResult.rows.length === 0 || adminResult.rows[0].email !== 'admin@nativesforum.org') {
      throw new Error('Admin access required');
    }

    return { adminUserId, client };
  } catch (error) {
    client.release();
    throw error;
  }
}

// GET - Get comprehensive pledge analytics
export async function GET(request: NextRequest) {
  try {
    const { client } = await verifyAdminAuth();
    const { searchParams } = new URL(request.url);

    // Get time range parameters
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    try {
      // Build date filter
      let dateFilter = '';
      let dateParams: string[] = [];

      if (fromDate && toDate) {
        dateFilter = 'AND p.created_at >= $1 AND p.created_at <= $2';
        dateParams = [fromDate, toDate];
      } else if (timeRange !== 'all') {
        dateFilter = `AND p.created_at >= NOW() - INTERVAL '${parseInt(timeRange)} days'`;
        dateParams = [];
      }

      // 1. Overall statistics
      const overallStatsQuery = `
        SELECT
          COUNT(*) as total_pledges,
          SUM(amount) as total_amount,
          COUNT(DISTINCT user_id) as unique_pledgers,
          AVG(amount) as average_pledge,
          COUNT(DISTINCT initiative_id) as initiatives_with_pledges,
          COUNT(CASE WHEN beneficiary_gender = 'male' THEN 1 END) as male_pledges,
          COUNT(CASE WHEN beneficiary_gender = 'female' THEN 1 END) as female_pledges,
          COUNT(CASE WHEN beneficiary_gender IS NULL THEN 1 END) as unspecified_gender
        FROM initiative_pledges p
        ${dateFilter ? `WHERE ${dateFilter.replace('AND ', '')}` : ''}
      `;

      const overallStatsResult = await client.query(overallStatsQuery, dateParams);
      const overallStats = overallStatsResult.rows[0];

      // 2. Pledges by initiative
      const initiativeStatsQuery = `
        SELECT
          i.id,
          i.title,
          i.status,
          COUNT(p.id) as pledge_count,
          SUM(p.amount) as total_amount,
          COUNT(DISTINCT p.user_id) as unique_pledgers,
          i.target_amount,
          i.target_participants,
          ROUND((SUM(p.amount) / i.target_amount * 100), 2) as amount_progress,
          ROUND((COUNT(p.id)::float / i.target_participants * 100), 2) as participant_progress
        FROM initiatives i
        LEFT JOIN initiative_pledges p ON i.id = p.initiative_id
${dateFilter ? dateFilter.replace('p.created_at', 'COALESCE(p.created_at, i.created_at)') : ''}
        GROUP BY i.id, i.title, i.status, i.target_amount, i.target_participants
        ORDER BY total_amount DESC NULLS LAST
      `;

      const initiativeStatsResult = await client.query(initiativeStatsQuery, dateParams);

      // 3. Pledges by province
      const provinceStatsQuery = `
        SELECT
          p.province,
          COUNT(*) as pledge_count,
          SUM(p.amount) as total_amount,
          COUNT(DISTINCT p.user_id) as unique_pledgers,
          AVG(p.amount) as average_pledge
        FROM initiative_pledges p
        ${dateFilter ? `WHERE ${dateFilter.replace('AND ', '')}` : ''}
        GROUP BY p.province
        ORDER BY total_amount DESC
      `;

      const provinceStatsResult = await client.query(provinceStatsQuery, dateParams);

      // 4. Daily pledge trends (last 30 days)
      const trendsQuery = `
        SELECT
          DATE(p.created_at) as pledge_date,
          COUNT(*) as daily_pledges,
          SUM(p.amount) as daily_amount,
          COUNT(DISTINCT p.user_id) as daily_unique_pledgers
        FROM initiative_pledges p
        WHERE p.created_at >= NOW() - INTERVAL '30 DAY'
        GROUP BY DATE(p.created_at)
        ORDER BY pledge_date DESC
        LIMIT 30
      `;

      const trendsResult = await client.query(trendsQuery);

      // 5. Top pledgers
      const topPledgersQuery = `
        SELECT
          u.first_name || ' ' || u.last_name as name,
          u.membership_number,
          u.province,
          COUNT(p.id) as pledge_count,
          SUM(p.amount) as total_amount
        FROM users u
        INNER JOIN initiative_pledges p ON u.id = p.user_id
        ${dateFilter ? `WHERE ${dateFilter.replace('AND ', '')}` : ''}
        GROUP BY u.id, u.first_name, u.last_name, u.membership_number, u.province
        ORDER BY total_amount DESC
        LIMIT 10
      `;

      const topPledgersResult = await client.query(topPledgersQuery, dateParams);

      // 6. Pledge amounts distribution
      const amountDistributionQuery = `
        SELECT
          CASE
            WHEN amount < 2000 THEN 'R1,200 - R1,999'
            WHEN amount < 5000 THEN 'R2,000 - R4,999'
            WHEN amount < 10000 THEN 'R5,000 - R9,999'
            WHEN amount < 25000 THEN 'R10,000 - R24,999'
            WHEN amount < 50000 THEN 'R25,000 - R49,999'
            ELSE 'R50,000+'
          END as amount_range,
          COUNT(*) as pledge_count,
          SUM(amount) as total_amount
        FROM initiative_pledges p
        ${dateFilter ? `WHERE ${dateFilter.replace('AND ', '')}` : ''}
        GROUP BY amount_range
        ORDER BY MIN(amount)
      `;

      const amountDistributionResult = await client.query(amountDistributionQuery, dateParams);

      // 7. Recent pledges
      const recentPledgesQuery = `
        SELECT
          p.id,
          p.amount,
          p.beneficiary_name,
          p.beneficiary_relationship,
          p.province,
          p.created_at,
          u.first_name || ' ' || u.last_name as pledger_name,
          u.membership_number,
          i.title as initiative_title
        FROM initiative_pledges p
        INNER JOIN users u ON p.user_id = u.id
        INNER JOIN initiatives i ON p.initiative_id = i.id
        ${dateFilter ? `WHERE ${dateFilter.replace('AND ', '')}` : ''}
        ORDER BY p.created_at DESC
        LIMIT 20
      `;

      const recentPledgesResult = await client.query(recentPledgesQuery, dateParams);

      return NextResponse.json({
        overallStats: {
          totalPledges: parseInt(overallStats.total_pledges) || 0,
          totalAmount: parseFloat(overallStats.total_amount) || 0,
          uniquePledgers: parseInt(overallStats.unique_pledgers) || 0,
          averagePledge: parseFloat(overallStats.average_pledge) || 0,
          initiativesWithPledges: parseInt(overallStats.initiatives_with_pledges) || 0,
          malePledges: parseInt(overallStats.male_pledges) || 0,
          femalePledges: parseInt(overallStats.female_pledges) || 0,
          unspecifiedGender: parseInt(overallStats.unspecified_gender) || 0
        },
        initiativeStats: initiativeStatsResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          status: row.status,
          pledgeCount: parseInt(row.pledge_count) || 0,
          totalAmount: parseFloat(row.total_amount) || 0,
          uniquePledgers: parseInt(row.unique_pledgers) || 0,
          targetAmount: parseFloat(row.target_amount) || 0,
          targetParticipants: parseInt(row.target_participants) || 0,
          amountProgress: parseFloat(row.amount_progress) || 0,
          participantProgress: parseFloat(row.participant_progress) || 0
        })),
        provinceStats: provinceStatsResult.rows.map(row => ({
          province: row.province,
          pledgeCount: parseInt(row.pledge_count),
          totalAmount: parseFloat(row.total_amount),
          uniquePledgers: parseInt(row.unique_pledgers),
          averagePledge: parseFloat(row.average_pledge)
        })),
        trends: trendsResult.rows.map(row => ({
          date: row.pledge_date,
          pledges: parseInt(row.daily_pledges),
          amount: parseFloat(row.daily_amount),
          uniquePledgers: parseInt(row.daily_unique_pledgers)
        })),
        topPledgers: topPledgersResult.rows.map(row => ({
          name: row.name,
          membershipNumber: row.membership_number,
          province: row.province,
          pledgeCount: parseInt(row.pledge_count),
          totalAmount: parseFloat(row.total_amount)
        })),
        amountDistribution: amountDistributionResult.rows.map(row => ({
          range: row.amount_range,
          count: parseInt(row.pledge_count),
          amount: parseFloat(row.total_amount)
        })),
        recentPledges: recentPledgesResult.rows.map(row => ({
          id: row.id,
          amount: parseFloat(row.amount),
          beneficiaryName: row.beneficiary_name,
          relationship: row.beneficiary_relationship,
          province: row.province,
          createdAt: row.created_at,
          pledgerName: row.pledger_name,
          membershipNumber: row.membership_number,
          initiativeTitle: row.initiative_title
        }))
      });

    } finally {
      client.release();
    }

  } catch (error: unknown) {
    console.error('Pledge analytics error:', error);

    if (error instanceof jwt.JsonWebTokenError || (error as Error).message === 'Authentication required' || (error as Error).message === 'Admin access required') {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: (error as Error).message === 'Authentication required' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}