import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// DELETE /api/groups/[groupId]/members/[membershipId] - Remove a member (admin or leader only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; membershipId: string }> }
) {
  try {
    const { slug } = await params;
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
    const { groupId, membershipId } = params;

    const client = await pool.connect();

    try {
      // Check if user is admin or group leader
      const authCheck = await client.query(
        `SELECT
          u.user_role,
          g.leader_id
         FROM users u
         LEFT JOIN groups g ON g.id = $2
         WHERE u.id = $1 AND u.is_active = true`,
        [userId, groupId]
      );

      if (authCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const { user_role, leader_id } = authCheck.rows[0];

      // Only admin or group leader can remove members
      if (user_role !== 'admin' && leader_id !== userId) {
        return NextResponse.json(
          { error: 'Only admins or group leaders can remove members' },
          { status: 403 }
        );
      }

      // Get member info before removing
      const memberCheck = await client.query(
        `SELECT gm.user_id, gm.role, u.first_name, u.last_name
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.id = $1 AND gm.group_id = $2 AND gm.is_active = true`,
        [membershipId, groupId]
      );

      if (memberCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }

      const member = memberCheck.rows[0];

      // Prevent removing the group leader (unless admin is doing it)
      if (member.role === 'leader' && user_role !== 'admin') {
        return NextResponse.json(
          { error: 'Cannot remove group leader. Transfer leadership first.' },
          { status: 403 }
        );
      }

      // Remove the member (soft delete)
      await client.query(
        'UPDATE group_members SET is_active = false WHERE id = $1',
        [membershipId]
      );

      return NextResponse.json({
        success: true,
        message: `${member.first_name} ${member.last_name} removed from group`
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[groupId]/members/[membershipId] - Update member role (admin or leader only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; membershipId: string }> }
) {
  try {
    const { slug } = await params;
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
    const { groupId, membershipId } = params;

    const body = await request.json();
    const { role } = body;

    if (!role || !['member', 'moderator', 'leader'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be member, moderator, or leader' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if user is admin or group leader
      const authCheck = await client.query(
        `SELECT
          u.user_role,
          g.leader_id
         FROM users u
         LEFT JOIN groups g ON g.id = $2
         WHERE u.id = $1 AND u.is_active = true`,
        [userId, groupId]
      );

      if (authCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const { user_role, leader_id } = authCheck.rows[0];

      // Only admin or group leader can change roles
      if (user_role !== 'admin' && leader_id !== userId) {
        return NextResponse.json(
          { error: 'Only admins or group leaders can change member roles' },
          { status: 403 }
        );
      }

      // Get member info
      const memberCheck = await client.query(
        `SELECT user_id FROM group_members
         WHERE id = $1 AND group_id = $2 AND is_active = true`,
        [membershipId, groupId]
      );

      if (memberCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }

      const targetUserId = memberCheck.rows[0].user_id;

      // If promoting to leader, update the group's leader_id
      if (role === 'leader') {
        await client.query('BEGIN');

        // Demote current leader to member (if not admin doing the change)
        if (leader_id && leader_id !== targetUserId) {
          await client.query(
            'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3',
            ['member', groupId, leader_id]
          );
        }

        // Update group leader
        await client.query(
          'UPDATE groups SET leader_id = $1 WHERE id = $2',
          [targetUserId, groupId]
        );

        // Update member role
        await client.query(
          'UPDATE group_members SET role = $1 WHERE id = $2',
          [role, membershipId]
        );

        await client.query('COMMIT');
      } else {
        // Just update the role for moderator/member
        await client.query(
          'UPDATE group_members SET role = $1 WHERE id = $2',
          [role, membershipId]
        );
      }

      return NextResponse.json({
        success: true,
        message: `Member role updated to ${role}`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}
