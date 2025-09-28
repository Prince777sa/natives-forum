// app/api/migrate/verification-status/route.ts - Add verification status to users table
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if column already exists
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verification_status'
      `;
      const columnExists = await client.query(checkColumnQuery);

      if (columnExists.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          message: 'verification_status column already exists'
        });
      }

      // Add verification_status column
      await client.query(`
        ALTER TABLE users
        ADD COLUMN verification_status VARCHAR(3) DEFAULT 'no'
        CHECK (verification_status IN ('yes', 'no'))
      `);

      // Create index for better performance
      await client.query(`
        CREATE INDEX idx_users_verification_status ON users(verification_status)
      `);

      // Add comment for documentation
      await client.query(`
        COMMENT ON COLUMN users.verification_status IS
        'User verification status: yes or no. Only admins can modify this field.'
      `);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'verification_status column added successfully to users table'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add verification_status column',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}