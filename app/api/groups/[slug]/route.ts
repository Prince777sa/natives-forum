import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/groups/[slug] - Get a specific group by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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
      // Get group details
      const groupQuery = `
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
          u.membership_number as leader_membership_number,
          u.profile_image_url as leader_profile_image
          ${userId ? `, EXISTS(
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = g.id
            AND gm.user_id = $2
            AND gm.is_active = true
          ) as is_member,
          (SELECT role FROM group_members gm
           WHERE gm.group_id = g.id
           AND gm.user_id = $2
           AND gm.is_active = true) as user_role` : ''}
        FROM groups g
        LEFT JOIN users u ON g.leader_id = u.id
        WHERE g.slug = $1 AND g.is_active = true
      `;

      const groupResult = userId
        ? await client.query(groupQuery, [slug, userId])
        : await client.query(groupQuery, [slug]);

      if (groupResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }

      const groupRow = groupResult.rows[0];

      // Get recent members
      const membersQuery = `
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.membership_number,
          u.profile_image_url,
          gm.role,
          gm.joined_at
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1 AND gm.is_active = true
        ORDER BY gm.joined_at DESC
        LIMIT 20
      `;

      const membersResult = await client.query(membersQuery, [groupRow.id]);

      const group = {
        id: groupRow.id.toString(),
        name: groupRow.name,
        slug: groupRow.slug,
        description: groupRow.description,
        location: groupRow.location,
        province: groupRow.province,
        memberCount: groupRow.member_count,
        leader: {
          id: groupRow.leader_id?.toString(),
          firstName: groupRow.leader_first_name,
          lastName: groupRow.leader_last_name,
          membershipNumber: groupRow.leader_membership_number,
          profileImageUrl: groupRow.leader_profile_image,
        },
        isMember: userId ? groupRow.is_member : false,
        userRole: userId ? groupRow.user_role : null,
        createdAt: groupRow.created_at,
        members: membersResult.rows.map(m => ({
          id: m.id.toString(),
          firstName: m.first_name,
          lastName: m.last_name,
          membershipNumber: m.membership_number,
          profileImageUrl: m.profile_image_url,
          role: m.role,
          joinedAt: m.joined_at,
        })),
      };

      return NextResponse.json({ group });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[slug] - Update a group (admin or group leader only)
export async function PATCH(
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
    const { name, description, location, province } = body;

    if (!name || !description || !location || !province) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check user role and group leadership
      const authCheck = await client.query(
        `SELECT
          u.user_role,
          g.id,
          g.leader_id
         FROM users u
         LEFT JOIN groups g ON g.slug = $2 AND g.is_active = true
         WHERE u.id = $1 AND u.is_active = true`,
        [userId, slug]
      );

      if (authCheck.rows.length === 0 || !authCheck.rows[0].id) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      const { user_role, leader_id, id: groupId } = authCheck.rows[0];

      // Only admin or group leader can update
      if (user_role !== 'admin' && leader_id !== userId) {
        return NextResponse.json(
          { error: 'Only admins or group leaders can update groups' },
          { status: 403 }
        );
      }

      // Update the group
      await client.query(
        `UPDATE groups
         SET name = $1, description = $2, location = $3, province = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [name, description, location, province, groupId]
      );

      return NextResponse.json({
        success: true,
        message: 'Group updated successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[slug] - Delete a group (admin or group leader only)
export async function DELETE(
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

    const client = await pool.connect();

    try {
      // Check user role and group leadership
      const authCheck = await client.query(
        `SELECT
          u.user_role,
          g.id,
          g.leader_id,
          g.name as group_name
         FROM users u
         LEFT JOIN groups g ON g.slug = $2 AND g.is_active = true
         WHERE u.id = $1 AND u.is_active = true`,
        [userId, slug]
      );

      if (authCheck.rows.length === 0 || !authCheck.rows[0].id) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      const { user_role, leader_id, id: groupId, group_name } = authCheck.rows[0];

      // Only admin or group leader can delete
      if (user_role !== 'admin' && leader_id !== userId) {
        return NextResponse.json(
          { error: 'Only admins or group leaders can delete groups' },
          { status: 403 }
        );
      }

      // Soft delete the group
      await client.query(
        'UPDATE groups SET is_active = false WHERE id = $1',
        [groupId]
      );

      // Also deactivate all memberships
      await client.query(
        'UPDATE group_members SET is_active = false WHERE group_id = $1',
        [groupId]
      );

      return NextResponse.json({
        success: true,
        message: `Group "${group_name}" deleted successfully`
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
