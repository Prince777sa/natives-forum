-- Add verification_status column to users table
-- This column tracks whether a user is verified by an admin

-- Add the verification_status column with default value 'no'
ALTER TABLE users
ADD COLUMN verification_status VARCHAR(3) DEFAULT 'no' CHECK (verification_status IN ('yes', 'no'));

-- Create an index for better query performance
CREATE INDEX idx_users_verification_status ON users(verification_status);

-- Update column comment for documentation
COMMENT ON COLUMN users.verification_status IS 'User verification status: yes or no. Only admins can modify this field.';

-- Show the updated table structure
\d users;