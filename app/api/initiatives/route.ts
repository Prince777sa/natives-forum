// app/api/initiatives/route.ts - Get all initiatives and create new ones
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Get all initiatives with category and author info
      const initiativesQuery = `
        SELECT
          i.*,
          c.name as category_name,
          c.slug as category_slug,
          u.first_name || ' ' || u.last_name as author_name
        FROM initiatives i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.author_id = u.id
        ORDER BY i.created_at DESC
      `;

      const result = await client.query(initiativesQuery);

      // Format the response
      const initiatives = result.rows.map(initiative => ({
        id: initiative.id,
        title: initiative.title,
        description: initiative.description,
        content: initiative.content,
        status: initiative.status,
        category: {
          name: initiative.category_name,
          slug: initiative.category_slug
        },
        author: initiative.author_name,
        targetParticipants: initiative.target_participants,
        currentParticipants: parseInt(initiative.current_participants) || 0,
        targetAmount: parseFloat(initiative.target_amount) || 0,
        currentAmount: parseFloat(initiative.current_amount) || 0,
        startDate: initiative.start_date,
        endDate: initiative.end_date,
        featured: initiative.featured,
        createdAt: initiative.created_at,
        updatedAt: initiative.updated_at
      }));

      return NextResponse.json({
        initiatives,
        total: initiatives.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get initiatives error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/initiatives - Create a new initiative
export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get request body
    const {
      title,
      description,
      content,
      categoryId,
      targetParticipants,
      targetAmount,
      startDate,
      endDate
    } = await request.json();

    // Validate required fields
    if (!title || !description || !content) {
      return NextResponse.json(
        { error: 'Title, description, and content are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if user has permission (admin or staff)
      const userQuery = 'SELECT user_role FROM users WHERE id = $1';
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userRole = userResult.rows[0].user_role;
      if (userRole !== 'admin' && userRole !== 'staff') {
        return NextResponse.json(
          { error: 'Permission denied. Only admin and staff can create initiatives.' },
          { status: 403 }
        );
      }

      // Insert new initiative
      const insertQuery = `
        INSERT INTO initiatives (
          title, description, content, category_id, author_id,
          target_participants, target_amount, start_date, end_date,
          status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id, title, description, status, created_at
      `;

      const result = await client.query(insertQuery, [
        title.trim(),
        description.trim(),
        content.trim(),
        categoryId || null,
        userId,
        targetParticipants || 0,
        targetAmount || 0,
        startDate || null,
        endDate || null,
        'draft' // New initiatives start as draft
      ]);

      const newInitiative = result.rows[0];

      return NextResponse.json({
        success: true,
        initiative: {
          id: newInitiative.id,
          title: newInitiative.title,
          description: newInitiative.description,
          status: newInitiative.status,
          createdAt: newInitiative.created_at
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create initiative error:', error);
    return NextResponse.json(
      { error: 'Failed to create initiative' },
      { status: 500 }
    );
  }
}