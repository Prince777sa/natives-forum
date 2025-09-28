import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(_request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      // Check if social media columns already exist
      const checkQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name IN ('twitter_handle', 'instagram_handle', 'linkedin_profile')
      `;

      const checkResult = await client.query(checkQuery);

      if (checkResult.rows.length === 0) {
        // Add social media columns if they don't exist
        const migrationQuery = `
          ALTER TABLE users
          ADD COLUMN twitter_handle VARCHAR(255),
          ADD COLUMN instagram_handle VARCHAR(255),
          ADD COLUMN linkedin_profile VARCHAR(255)
        `;

        await client.query(migrationQuery);

        return NextResponse.json({
          success: true,
          message: 'Social media fields added successfully'
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Social media fields already exist'
        });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Social media migration error:', error);
    return NextResponse.json(
      { error: 'Failed to add social media fields' },
      { status: 500 }
    );
  }
}