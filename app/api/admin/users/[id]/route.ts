// app/api/admin/users/[id]/route.ts - Individual user management
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

interface JwtPayload {
  userId: string;
}

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

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new Error('Authentication required');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
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

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client } = await verifyAdminAuth();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    try {
      const body = await request.json();
      const validatedData = updateUserSchema.parse(body);

      // Check if email is already taken by another user
      const emailCheckQuery = `
        SELECT id FROM users WHERE email = $1 AND id != $2
      `;
      const emailCheckResult = await client.query(emailCheckQuery, [validatedData.email, userId]);

      if (emailCheckResult.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }

      // Update user
      const updateQuery = `
        UPDATE users
        SET
          first_name = $1,
          last_name = $2,
          email = $3,
          province = $4,
          sex = $5,
          user_role = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, first_name, last_name, email, membership_number, province, sex, user_role, created_at, updated_at
      `;

      const result = await client.query(updateQuery, [
        validatedData.firstName,
        validatedData.lastName,
        validatedData.email,
        validatedData.province,
        validatedData.sex,
        validatedData.userRole || 'member',
        userId
      ]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'User updated successfully',
        user: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof jwt.JsonWebTokenError || (error as Error).message === 'Authentication required' || (error as Error).message === 'Admin access required') {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: (error as Error).message === 'Authentication required' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client } = await verifyAdminAuth();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if user exists and is not admin
      const userQuery = `SELECT email FROM users WHERE id = $1`;
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Prevent deletion of admin user
      if (userResult.rows[0].email === 'admin@nativesforum.org') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Cannot delete admin user' },
          { status: 400 }
        );
      }

      // Delete related records first (foreign key constraints)
      await client.query('DELETE FROM initiative_pledges WHERE user_id = $1', [userId]);

      // Delete user
      const deleteQuery = `DELETE FROM users WHERE id = $1 RETURNING id, email`;
      const deleteResult = await client.query(deleteQuery, [userId]);

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'User deleted successfully',
        deletedUser: deleteResult.rows[0]
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof jwt.JsonWebTokenError || (error as Error).message === 'Authentication required' || (error as Error).message === 'Admin access required') {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: (error as Error).message === 'Authentication required' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}