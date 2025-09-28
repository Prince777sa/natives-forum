// lib/db.ts - Updated database functions with profile image support
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Generate membership number (backup JavaScript function)
export function generateMembershipNumber(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let membershipNumber = '';
  
  // Generate 4 random letters
  for (let i = 0; i < 4; i++) {
    membershipNumber += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Generate 4 random numbers
  for (let i = 0; i < 4; i++) {
    membershipNumber += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return membershipNumber;
}

// User registration function (updated to include profile_image_url)
export async function createUser(userData: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  sex: string;
  province: string;
  isSouthAfricanNative: boolean;
  willingToVolunteer: boolean;
}) {
  const client = await pool.connect();
  
  try {
    const query = `
      INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        sex, 
        province, 
        is_south_african_native, 
        willing_to_volunteer,
        user_role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name, membership_number, profile_image_url, created_at
    `;
    
    const values = [
      userData.email,
      userData.passwordHash,
      userData.firstName,
      userData.lastName,
      userData.sex,
      userData.province,
      userData.isSouthAfricanNative,
      userData.willingToVolunteer,
      'regular' // default role
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// Update user profile image
export async function updateUserProfileImage(userId: string, imageUrl: string) {
  const client = await pool.connect();
  
  try {
    const query = `
      UPDATE users 
      SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING id, first_name, last_name, profile_image_url
    `;
    
    const result = await client.query(query, [imageUrl, userId]);
    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// Get user with profile image
export async function getUserById(userId: string) {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        id, email, first_name, last_name, membership_number, 
        profile_image_url, user_role, province, willing_to_volunteer, created_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await client.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// Check if email already exists
export async function emailExists(email: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT id FROM users WHERE email = $1';
    const result = await client.query(query, [email]);
    return result.rows.length > 0;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// Get user by membership number
export async function getUserByMembershipNumber(membershipNumber: string) {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        id, email, first_name, last_name, membership_number, profile_image_url,
        user_role, created_at
      FROM users 
      WHERE membership_number = $1 AND is_active = true
    `;
    const result = await client.query(query, [membershipNumber]);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

// Check if membership number exists (for validation)
export async function membershipNumberExists(membershipNumber: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const query = 'SELECT id FROM users WHERE membership_number = $1';
    const result = await client.query(query, [membershipNumber]);
    return result.rows.length > 0;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}