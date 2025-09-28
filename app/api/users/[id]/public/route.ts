import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /api/users/[id]/public - Get public user information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await pool.connect();

    try {
      // Get public user information
      const userQuery = `
        SELECT
          id,
          first_name,
          last_name,
          user_role,
          province,
          profile_image_url,
          verification_status,
          twitter_handle,
          instagram_handle,
          linkedin_profile,
          created_at
        FROM users
        WHERE id = $1 AND is_active = true
      `;

      const userResult = await client.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Format the public user data
      const publicUserData = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        userRole: user.user_role,
        province: user.province,
        profileImageUrl: user.profile_image_url,
        verificationStatus: user.verification_status,
        twitterHandle: user.twitter_handle,
        instagramHandle: user.instagram_handle,
        linkedinProfile: user.linkedin_profile,
        joinedDate: user.created_at
      };

      return NextResponse.json({
        user: publicUserData
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching public user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}