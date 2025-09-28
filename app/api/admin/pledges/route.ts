// app/api/admin/pledges/route.ts - Admin pledge management
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

interface JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';


// GET - Get all pledges with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const adminUserId = decoded.userId;

    const client = await pool.connect();

    try {
      const adminQuery = `SELECT email FROM users WHERE id = $1`;
      const adminResult = await client.query(adminQuery, [adminUserId]);

      if (adminResult.rows.length === 0 || adminResult.rows[0].email !== 'admin@nativesforum.org') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Get pagination parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const initiative = searchParams.get('initiative') || '';
      const province = searchParams.get('province') || '';
      const sortBy = searchParams.get('sortBy') || 'created_at';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      const offset = (page - 1) * limit;

      // Build search conditions
      const whereConditions = ['1=1'];
      const queryParams: (string | number)[] = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereConditions.push(`(
          u.first_name ILIKE $${paramCount} OR
          u.last_name ILIKE $${paramCount} OR
          u.membership_number ILIKE $${paramCount} OR
          p.beneficiary_name ILIKE $${paramCount} OR
          i.title ILIKE $${paramCount}
        )`);
        queryParams.push(`%${search}%`);
      }

      if (initiative) {
        paramCount++;
        whereConditions.push(`p.initiative_id = $${paramCount}`);
        queryParams.push(initiative);
      }

      if (province) {
        paramCount++;
        whereConditions.push(`p.province = $${paramCount}`);
        queryParams.push(province);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM initiative_pledges p
        INNER JOIN users u ON p.user_id = u.id
        INNER JOIN initiatives i ON p.initiative_id = i.id
        WHERE ${whereClause}
      `;
      const countResult = await client.query(countQuery, queryParams);
      const totalPledges = parseInt(countResult.rows[0].total);

      // Get pledges with pagination
      const pledgesQuery = `
        SELECT
          p.id,
          p.amount,
          p.beneficiary_name,
          p.beneficiary_relationship,
          p.beneficiary_gender,
          p.province,
          p.created_at,
          u.first_name || ' ' || u.last_name as pledger_name,
          u.membership_number,
          u.email as pledger_email,
          i.id as initiative_id,
          i.title as initiative_title,
          i.status as initiative_status
        FROM initiative_pledges p
        INNER JOIN users u ON p.user_id = u.id
        INNER JOIN initiatives i ON p.initiative_id = i.id
        WHERE ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      const pledgesResult = await client.query(pledgesQuery, [...queryParams, limit, offset]);

      const totalPages = Math.ceil(totalPledges / limit);

      // Format the response
      const pledges = pledgesResult.rows.map(pledge => ({
        id: pledge.id,
        amount: parseFloat(pledge.amount),
        beneficiaryName: pledge.beneficiary_name,
        relationship: pledge.beneficiary_relationship,
        gender: pledge.beneficiary_gender,
        province: pledge.province,
        createdAt: pledge.created_at,
        pledger: {
          name: pledge.pledger_name,
          membershipNumber: pledge.membership_number,
          email: pledge.pledger_email
        },
        initiative: {
          id: pledge.initiative_id,
          title: pledge.initiative_title,
          status: pledge.initiative_status
        }
      }));

      return NextResponse.json({
        pledges,
        pagination: {
          currentPage: page,
          totalPages,
          totalPledges,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get admin pledges error:', error);

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