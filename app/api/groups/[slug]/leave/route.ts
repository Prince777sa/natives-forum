import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/groups/[slug]/leave - Leave a group
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
      // Get group ID from slug
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

      // Check if user is a member
      const memberCheck = await client.query(
        'SELECT id, role FROM group_members WHERE group_id = $1 AND user_id = $2 AND is_active = true',
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Not a member of this branch' },
          { status: 400 }
        );
      }

      const membership = memberCheck.rows[0];

      // Prevent leader from leaving (they must transfer leadership first)
      if (membership.role === 'leader') {
        return NextResponse.json(
          { error: 'Branch leaders cannot leave. Please transfer leadership first.' },
          { status: 403 }
        );
      }

      // Mark membership as inactive (soft delete)
      await client.query(
        'UPDATE group_members SET is_active = false WHERE id = $1',
        [membership.id]
      );

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Failed to leave branch' },
      { status: 500 }
    );
  }
}
