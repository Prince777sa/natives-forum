-- Add social media fields to users table
ALTER TABLE users
ADD COLUMN twitter_handle VARCHAR(255),
ADD COLUMN instagram_handle VARCHAR(255),
ADD COLUMN linkedin_profile VARCHAR(255);