import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/groups/[slug]/members - Get all members of a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const client = await pool.connect();

    try {
      // Get group ID from slug
      const groupResult = await client.query(
        'SELECT id FROM groups WHERE slug = $1 AND is_active = true',
        [slug]
      );

      if (groupResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      const groupId = groupResult.rows[0].id;

      // Get all active members
      const result = await client.query(
        `SELECT
          gm.id as membership_id,
          gm.role,
          gm.joined_at,
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.membership_number,
          u.profile_image_url,
          u.user_role
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1 AND gm.is_active = true
         ORDER BY
           CASE gm.role
             WHEN 'leader' THEN 1
             WHEN 'moderator' THEN 2
             WHEN 'member' THEN 3
           END,
           gm.joined_at ASC`,
        [groupId]
      );

      const members = result.rows.map(row => ({
        membershipId: row.membership_id.toString(),
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        membershipNumber: row.membership_number,
        profileImageUrl: row.profile_image_url,
        userRole: row.user_role,
        groupRole: row.role,
        joinedAt: row.joined_at,
      }));

      return NextResponse.json({ members });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
