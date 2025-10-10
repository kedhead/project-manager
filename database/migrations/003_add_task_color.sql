-- Add color field to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN tasks.color IS 'Hex color code for task bar (e.g., #FF5733)';
