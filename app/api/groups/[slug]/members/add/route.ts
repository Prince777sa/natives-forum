import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/groups/[slug]/members/add - Add a member to group (admin or leader only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const body = await request.json();
    const { membershipNumber, role = 'member' } = body;

    if (!membershipNumber) {
      return NextResponse.json(
        { error: 'Membership number is required' },
        { status: 400 }
      );
    }

    if (!['member', 'moderator'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Can only add as member or moderator' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get group ID from slug
      const groupResult = await client.query(
        'SELECT id, leader_id, name FROM groups WHERE slug = $1 AND is_active = true',
        [slug]
      );

      if (groupResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      const groupId = groupResult.rows[0].id;
      const leader_id = groupResult.rows[0].leader_id;
      const group_name = groupResult.rows[0].name;

      // Check if user is admin or group leader
      const authCheck = await client.query(
        `SELECT user_role FROM users WHERE id = $1 AND is_active = true`,
        [userId]
      );

      if (authCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user_role = authCheck.rows[0].user_role;

      // Only admin or group leader can add members
      if (user_role !== 'admin' && leader_id !== userId) {
        return NextResponse.json(
          { error: 'Only admins or group leaders can add members' },
          { status: 403 }
        );
      }

      // Find user by membership number
      const userCheck = await client.query(
        'SELECT id, first_name, last_name FROM users WHERE membership_number = $1 AND is_active = true',
        [membershipNumber]
      );

      if (userCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found with that membership number' },
          { status: 404 }
        );
      }

      const targetUser = userCheck.rows[0];

      // Check if user is already a member
      const memberCheck = await client.query(
        'SELECT id, is_active FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, targetUser.id]
      );

      if (memberCheck.rows.length > 0) {
        const membership = memberCheck.rows[0];

        if (membership.is_active) {
          return NextResponse.json(
            { error: `${targetUser.first_name} ${targetUser.last_name} is already a member of this group` },
            { status: 400 }
          );
        } else {
          // Reactivate membership
          await client.query(
            'UPDATE group_members SET is_active = true, role = $1, joined_at = CURRENT_TIMESTAMP WHERE id = $2',
            [role, membership.id]
          );
        }
      } else {
        // Add new member
        await client.query(
          'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
          [groupId, targetUser.id, role]
        );
      }

      return NextResponse.json({
        success: true,
        message: `${targetUser.first_name} ${targetUser.last_name} added to ${group_name}`,
        user: {
          id: targetUser.id,
          firstName: targetUser.first_name,
          lastName: targetUser.last_name,
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
