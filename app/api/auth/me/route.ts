// app/api/auth/me/route.ts - Get current user info
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'auth-token';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const client = await pool.connect();
    
    try {
      // Check if session exists and is valid
      const sessionQuery = `
        SELECT us.expires_at, u.id, u.email, u.first_name, u.last_name,
               u.membership_number, u.user_role, u.province, u.willing_to_volunteer,
               u.created_at, u.profile_image_url, u.verification_status,
               u.twitter_handle, u.instagram_handle, u.linkedin_profile
        FROM user_sessions us
        JOIN users u ON u.id = us.user_id
        WHERE us.session_token = $1 AND us.expires_at > NOW() AND u.is_active = true
      `;
      
      const result = await client.query(sessionQuery, [token]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 }
        );
      }

      const user = result.rows[0];
      
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
        verification_status: user.verification_status,
        twitter_handle: user.twitter_handle,
        instagram_handle: user.instagram_handle,
        linkedin_profile: user.linkedin_profile,
      };

      return NextResponse.json({ user: userData });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

// app/api/auth/logout/route.ts - Logout endpoint
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const client = await pool.connect();
      
      try {
        // Remove session from database
        await client.query(
          'DELETE FROM user_sessions WHERE session_token = $1',
          [token]
        );
      } finally {
        client.release();
      }
    }

    // Clear the cookie
    cookieStore.delete(COOKIE_NAME);

    return NextResponse.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}