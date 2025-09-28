// app/api/admin/initiatives/[id]/route.ts - Individual initiative management
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

// PUT - Update initiative
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client } = await verifyAdminAuth();
    const resolvedParams = await params;
    const initiativeId = resolvedParams.id;

    try {
      const body = await request.json();
      const validatedData = updateInitiativeSchema.parse(body);

      // Check if initiative exists
      const checkQuery = `SELECT id FROM initiatives WHERE id = $1`;
      const checkResult = await client.query(checkQuery, [initiativeId]);

      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Initiative not found' },
          { status: 404 }
        );
      }

      // Update initiative
      const updateQuery = `
        UPDATE initiatives
        SET
          title = $1,
          description = $2,
          content = $3,
          status = $4,
          target_participants = $5,
          target_amount = $6,
          featured = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING
          id, title, description, content, status, target_participants, target_amount,
          featured, created_at, updated_at
      `;

      const result = await client.query(updateQuery, [
        validatedData.title,
        validatedData.description,
        validatedData.content || '',
        validatedData.status,
        validatedData.targetParticipants,
        validatedData.targetAmount,
        validatedData.featured || false,
        initiativeId
      ]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Initiative not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Initiative updated successfully',
        initiative: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update initiative error:', error);

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

// DELETE - Delete initiative
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client } = await verifyAdminAuth();
    const resolvedParams = await params;
    const initiativeId = resolvedParams.id;

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if initiative exists
      const initiativeQuery = `SELECT title FROM initiatives WHERE id = $1`;
      const initiativeResult = await client.query(initiativeQuery, [initiativeId]);

      if (initiativeResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Initiative not found' },
          { status: 404 }
        );
      }

      // Delete related records first (foreign key constraints)
      await client.query('DELETE FROM initiative_pledges WHERE initiative_id = $1', [initiativeId]);

      // Delete initiative
      const deleteQuery = `DELETE FROM initiatives WHERE id = $1 RETURNING id, title`;
      const deleteResult = await client.query(deleteQuery, [initiativeId]);

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Initiative deleted successfully',
        deletedInitiative: deleteResult.rows[0]
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Delete initiative error:', error);

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