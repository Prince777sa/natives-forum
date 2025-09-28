-- Add parent_comment_id column to support nested comments (replies)
-- This allows comments to have replies, but replies cannot have sub-replies (1-level nesting)

ALTER TABLE initiative_comments
ADD COLUMN parent_comment_id UUID REFERENCES initiative_comments(id) ON DELETE CASCADE;

-- Add index for better performance when querying nested comments
CREATE INDEX idx_initiative_comments_parent_id ON initiative_comments(parent_comment_id);

-- Add index for querying top-level comments efficiently
CREATE INDEX idx_initiative_comments_top_level ON initiative_comments(initiative_id) WHERE parent_comment_id IS NULL;