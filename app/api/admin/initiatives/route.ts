// app/api/admin/initiatives/route.ts - Admin initiative management
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

// Validation schema for initiative updates
const updateInitiativeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  content: z.string().optional(),
  status: z.enum(['draft', 'active', 'closed', 'completed'], {
    message: 'Status must be draft, active, closed, or completed',
  }),
  targetParticipants: z.number().min(1, 'Target participants must be at least 1'),
  targetAmount: z.number().min(0, 'Target amount must be non-negative'),
  featured: z.boolean().optional(),
});

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new Error('Authentication required');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as any;
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

// GET - Get all initiatives with pagination for admin
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
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const sortBy = searchParams.get('sortBy') || 'created_at';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      const offset = (page - 1) * limit;

      // Build search condition
      let searchCondition = '';
      let searchParams_array: string[] = [];
      if (search) {
        searchCondition = `WHERE (i.title ILIKE $1 OR i.description ILIKE $1 OR i.status ILIKE $1)`;
        searchParams_array = [`%${search}%`];
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM initiatives i
        ${searchCondition}
      `;
      const countResult = await client.query(countQuery, searchParams_array);
      const totalInitiatives = parseInt(countResult.rows[0].total);

      // Get initiatives with pagination
      const initiativesQuery = `
        SELECT
          i.*,
          c.name as category_name,
          c.slug as category_slug,
          u.first_name || ' ' || u.last_name as author_name
        FROM initiatives i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.author_id = u.id
        ${searchCondition}
        ORDER BY i.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${searchParams_array.length + 1} OFFSET $${searchParams_array.length + 2}
      `;

      const queryParams = [...searchParams_array, limit, offset];
      const initiativesResult = await client.query(initiativesQuery, queryParams);

      const totalPages = Math.ceil(totalInitiatives / limit);

      // Format the response
      const initiatives = initiativesResult.rows.map(initiative => ({
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
        updatedAt: initiative.updated_at
      }));

      return NextResponse.json({
        initiatives,
        pagination: {
          currentPage: page,
          totalPages,
          totalInitiatives,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get admin initiatives error:', error);

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