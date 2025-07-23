-- Migration: Enhance asana schema with 12 comprehensive components
-- Date: 2025-07-20
-- Description: Add all required fields for comprehensive asana experience

BEGIN;

-- Add new columns for complete asana experience
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS sanskrit_mantra TEXT;
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS mantra_transliteration TEXT;
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS mantra_translation TEXT;
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS weight_needed BOOLEAN DEFAULT FALSE;
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS weight_description TEXT;
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS rudraksha_jewelery TEXT DEFAULT 'Standard rudraksha mala (108 beads)';
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS bhasma TEXT DEFAULT 'Vibhuti (sacred ash) applied to forehead';
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS sriyantra TEXT DEFAULT 'Meditation on Sri Yantra for divine energy';
ALTER TABLE asanas ADD COLUMN IF NOT EXISTS aushadha TEXT DEFAULT 'Tulsi leaves or neem for purification';

-- Enhance existing fields with better structure
ALTER TABLE asanas ALTER COLUMN bandha TYPE TEXT;
ALTER TABLE asanas ALTER COLUMN mudra TYPE TEXT;
ALTER TABLE asanas ALTER COLUMN drishti TYPE TEXT;
ALTER TABLE asanas ALTER COLUMN visualization TYPE TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asanas_difficulty_time ON asanas(difficulty_level, time_minutes);
CREATE INDEX IF NOT EXISTS idx_asanas_sequence_difficulty ON asanas(sequence_stage, difficulty_level);

-- Update existing data with proper duration rules
UPDATE asanas SET time_minutes = 2 WHERE difficulty_level = 'beginner' AND time_minutes < 2;
UPDATE asanas SET time_minutes = 1 WHERE difficulty_level IN ('intermediate', 'advanced') AND time_minutes > 1;

-- Add default values for spiritual components where missing
UPDATE asanas SET 
    rudraksha_jewelery = COALESCE(rudraksha_jewelery, 'Standard rudraksha mala (108 beads)'),
    bhasma = COALESCE(bhasma, 'Vibhuti (sacred ash) applied to forehead'),
    sriyantra = COALESCE(sriyantra, 'Meditation on Sri Yantra for divine energy'),
    aushadha = COALESCE(aushadha, 'Tulsi leaves or neem for purification')
WHERE 
    rudraksha_jewelery IS NULL OR 
    bhasma IS NULL OR 
    sriyantra IS NULL OR 
    aushadha IS NULL;

COMMIT;