// app/api/admin/users/route.ts - Admin user management
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

// Validation schema for user updates
const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  province: z.string().min(1, 'Province is required'),
  sex: z.enum(['male', 'female', 'other'], {
    message: 'Sex is required',
  }),
  userRole: z.string().optional(),
});

// GET - Get all users with pagination
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

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminUserId = decoded.userId;

    // Verify admin privileges
    const client = await pool.connect();

    try {
      const adminQuery = `
        SELECT email FROM users WHERE id = $1
      `;
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
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const sortBy = searchParams.get('sortBy') || 'created_at';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      const offset = (page - 1) * limit;

      // Build search condition
      let searchCondition = '';
      let searchParams_array = [];
      if (search) {
        searchCondition = `WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR membership_number ILIKE $1)`;
        searchParams_array = [`%${search}%`];
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users
        ${searchCondition}
      `;
      const countResult = await client.query(countQuery, searchParams_array);
      const totalUsers = parseInt(countResult.rows[0].total);

      // Get users with pagination
      const usersQuery = `
        SELECT
          id,
          first_name,
          last_name,
          email,
          membership_number,
          province,
          sex,
          user_role,
          verification_status,
          profile_image_url,
          created_at,
          updated_at
        FROM users
        ${searchCondition}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${searchParams_array.length + 1} OFFSET $${searchParams_array.length + 2}
      `;

      const queryParams = [...searchParams_array, limit, offset];
      const usersResult = await client.query(usersQuery, queryParams);

      const totalPages = Math.ceil(totalUsers / limit);

      return NextResponse.json({
        users: usersResult.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get users error:', error);

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