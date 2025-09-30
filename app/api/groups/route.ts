import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/groups - Get all groups
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        // Invalid token, proceed without user context
      }
    }

    const client = await pool.connect();

    try {
      const query = `
        SELECT
          g.id,
          g.name,
          g.slug,
          g.description,
          g.location,
          g.province,
          g.member_count,
          g.created_at,
          u.id as leader_id,
          u.first_name as leader_first_name,
          u.last_name as leader_last_name,
          u.membership_number as leader_membership_number
          ${userId ? `, EXISTS(
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = g.id
            AND gm.user_id = $1
            AND gm.is_active = true
          ) as is_member` : ''}
        FROM groups g
        LEFT JOIN users u ON g.leader_id = u.id
        WHERE g.is_active = true
        ORDER BY g.created_at DESC
      `;

      const result = userId
        ? await client.query(query, [userId])
        : await client.query(query.replace('$1', 'NULL'));

      const groups = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        slug: row.slug,
        description: row.description,
        location: row.location,
        province: row.province,
        memberCount: row.member_count,
        leader: {
          id: row.leader_id?.toString(),
          firstName: row.leader_first_name,
          lastName: row.leader_last_name,
          membershipNumber: row.leader_membership_number,
        },
        isMember: userId ? row.is_member : false,
        createdAt: row.created_at,
      }));

      return NextResponse.json({ groups });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group (staff only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Check if user is staff or admin
    const client = await pool.connect();

    try {
      const userCheck = await client.query(
        'SELECT user_role FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userRole = userCheck.rows[0].user_role;
      if (userRole !== 'staff' && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Only staff members can create branches' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { name, description, location, province } = body;

      if (!name || !description || !location || !province) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Generate unique slug
      let slug = generateSlug(name);
      let slugCounter = 1;
      let slugExists = true;

      while (slugExists) {
        const slugCheck = await client.query(
          'SELECT id FROM groups WHERE slug = $1',
          [slug]
        );

        if (slugCheck.rows.length === 0) {
          slugExists = false;
        } else {
          slug = `${generateSlug(name)}-${slugCounter}`;
          slugCounter++;
        }
      }

      // Create the group
      const result = await client.query(
        `INSERT INTO groups (name, slug, description, location, province, creator_id, leader_id)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         RETURNING id, name, slug, description, location, province, member_count, created_at`,
        [name, description, slug, location, province, userId]
      );

      const group = result.rows[0];

      // Auto-join the creator as a member with leader role
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role)
         VALUES ($1, $2, 'leader')`,
        [group.id, userId]
      );

      // Get creator info
      const creatorInfo = await client.query(
        'SELECT first_name, last_name, membership_number FROM users WHERE id = $1',
        [userId]
      );

      return NextResponse.json({
        group: {
          id: group.id.toString(),
          name: group.name,
          slug: group.slug,
          description: group.description,
          location: group.location,
          province: group.province,
          memberCount: 1, // Creator is first member
          leader: {
            id: userId,
            firstName: creatorInfo.rows[0].first_name,
            lastName: creatorInfo.rows[0].last_name,
            membershipNumber: creatorInfo.rows[0].membership_number,
          },
          isMember: true,
          createdAt: group.created_at,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
