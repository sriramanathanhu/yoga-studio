-- Migration: Initial schema documentation
-- Date: 2024-01-19
-- Description: Document the existing schema as baseline migration

BEGIN;

-- This migration documents the current schema state
-- All tables already exist from the initial database setup
-- This serves as a baseline for future migrations

-- Users table (already exists)
-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     hashed_password VARCHAR(255) NOT NULL,
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- User profiles table (already exists)  
-- CREATE TABLE IF NOT EXISTS user_profiles (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     first_name VARCHAR(100),
--     last_name VARCHAR(100),
--     age INTEGER,
--     fitness_level VARCHAR(20),
--     health_conditions TEXT[],
--     goals TEXT[],
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE(user_id)
-- );

-- Asanas table (already exists)
-- CREATE TABLE IF NOT EXISTS asanas (
--     id SERIAL PRIMARY KEY,
--     english_name VARCHAR(255) NOT NULL,
--     sanskrit_name VARCHAR(255),
--     description TEXT,
--     goal_tags TEXT[],
--     difficulty_level VARCHAR(20),
--     time_minutes INTEGER,
--     contraindications TEXT,
--     sequence_stage VARCHAR(50),
--     technique_instructions TEXT,
--     alignment_cues TEXT,
--     breathing_pattern TEXT,
--     benefits TEXT
-- );

-- Routines table (already exists)
-- CREATE TABLE IF NOT EXISTS routines (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     asana_ids INTEGER[],
--     total_duration INTEGER,
--     difficulty_level VARCHAR(20),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Feedback table (already exists)
-- CREATE TABLE IF NOT EXISTS feedback (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     routine_id INTEGER REFERENCES routines(id) ON DELETE CASCADE,
--     asana_id INTEGER REFERENCES asanas(id) ON DELETE CASCADE,
--     rating INTEGER CHECK (rating >= 1 AND rating <= 5),
--     difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
--     comments TEXT,
--     session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Insert baseline migration record
INSERT INTO schema_migrations (migration_name) 
VALUES ('20240119_000000_initial_schema.sql')
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;