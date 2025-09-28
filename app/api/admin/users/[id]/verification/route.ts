import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

// PATCH /api/admin/users/[id]/verification - Update user verification status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { verification_status } = await request.json();

    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const adminUserId = decoded.userId;

    // Validate verification status
    if (!['yes', 'no'].includes(verification_status)) {
      return NextResponse.json(
        { error: 'Invalid verification status. Must be "yes" or "no"' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if the requesting user is an admin
      const adminQuery = 'SELECT user_role FROM users WHERE id = $1';
      const adminResult = await client.query(adminQuery, [adminUserId]);

      if (adminResult.rows.length === 0 || adminResult.rows[0].user_role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Check if target user exists
      const userQuery = 'SELECT id, first_name, last_name, verification_status FROM users WHERE id = $1';
      const userResult = await client.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Update verification status
      const updateQuery = `
        UPDATE users
        SET verification_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, first_name, last_name, verification_status
      `;

      const updateResult = await client.query(updateQuery, [verification_status, id]);
      const updatedUser = updateResult.rows[0];

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `User verification status updated to "${verification_status}"`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating user verification status:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update verification status' },
      { status: 500 }
    );
  }
}