// app/api/auth/signin/route.ts - Sign in API endpoint
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

const signinSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'auth-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signinSchema.parse(body);

    const client = await pool.connect();
    
    try {
      // Get user from database
      const query = `
        SELECT
          id, email, password_hash, first_name, last_name,
          membership_number, user_role, province, willing_to_volunteer,
          is_active, email_verified, created_at, profile_image_url
        FROM users
        WHERE email = $1 AND is_active = true
      `;
      
      const result = await client.query(query, [validatedData.email]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(
        validatedData.password, 
        user.password_hash
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Create JWT token
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.user_role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { 
        expiresIn: '7d' // Token expires in 7 days
      });

      // Store session in database
      const sessionQuery = `
        INSERT INTO user_sessions (user_id, session_token, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_token) 
        DO UPDATE SET expires_at = $3
        RETURNING id
      `;
      
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await client.query(sessionQuery, [user.id, token, expiresAt]);

      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      });

      // Return user data (without password)
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        membershipNumber: user.membership_number,
        userRole: user.user_role,
        province: user.province,
        willingToVolunteer: user.willing_to_volunteer,
        createdAt: user.created_at,
        profile_image_url: user.profile_image_url,
      };

      return NextResponse.json({
        message: 'Login successful',
        user: userData,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Sign in error:', error);

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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}