import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/groups/[slug]/join - Join a group
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

    const client = await pool.connect();

    try {
      // Check if group exists and get ID
      const groupCheck = await client.query(
        'SELECT id FROM groups WHERE slug = $1 AND is_active = true',
        [slug]
      );

      if (groupCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Branch not found' },
          { status: 404 }
        );
      }

      const groupId = groupCheck.rows[0].id;

      // Check if already a member
      const memberCheck = await client.query(
        'SELECT id, is_active FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (memberCheck.rows.length > 0) {
        const membership = memberCheck.rows[0];

        if (membership.is_active) {
          return NextResponse.json(
            { error: 'Already a member of this branch' },
            { status: 400 }
          );
        } else {
          // Reactivate membership
          await client.query(
            'UPDATE group_members SET is_active = true, joined_at = CURRENT_TIMESTAMP WHERE id = $1',
            [membership.id]
          );
        }
      } else {
        // Add as new member
        await client.query(
          'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
          [groupId, userId, 'member']
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join branch' },
      { status: 500 }
    );
  }
}
