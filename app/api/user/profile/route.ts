// app/api/user/profile/route.ts - Update user profile information
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

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  province: z.enum([
    'eastern-cape', 'free-state', 'gauteng', 'kwazulu-natal',
    'limpopo', 'mpumalanga', 'northern-cape', 'north-west', 'western-cape'
  ], {
    message: 'Province selection is required',
  }),
  willingToVolunteer: z.boolean(),
  twitterHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  linkedinProfile: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    // Get and verify auth token
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const userId = decoded.userId;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const client = await pool.connect();

    try {
      // Check if session exists and is valid, then update user
      const updateQuery = `
        UPDATE users
        SET
          first_name = $1,
          last_name = $2,
          province = $3,
          willing_to_volunteer = $4,
          twitter_handle = $5,
          instagram_handle = $6,
          linkedin_profile = $7,
          updated_at = CURRENT_TIMESTAMP
        FROM user_sessions us
        WHERE users.id = us.user_id
          AND us.session_token = $8
          AND us.expires_at > NOW()
          AND users.is_active = true
          AND users.id = $9
        RETURNING users.id, users.email, users.first_name, users.last_name,
                 users.membership_number, users.user_role, users.province,
                 users.willing_to_volunteer, users.created_at, users.profile_image_url,
                 users.twitter_handle, users.instagram_handle, users.linkedin_profile
      `;

      const result = await client.query(updateQuery, [
        validatedData.firstName,
        validatedData.lastName,
        validatedData.province,
        validatedData.willingToVolunteer,
        validatedData.twitterHandle || null,
        validatedData.instagramHandle || null,
        validatedData.linkedinProfile || null,
        token,
        userId
      ]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid session or user not found' },
          { status: 401 }
        );
      }

      const user = result.rows[0];

      // Return updated user data
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
        twitter_handle: user.twitter_handle,
        instagram_handle: user.instagram_handle,
        linkedin_profile: user.linkedin_profile,
      };

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: userData,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Profile update error:', error);

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

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}