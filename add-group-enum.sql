-- Add 'group' to entity_type enum
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'group';

SELECT 'Added group to entity_type enum!' as status;
