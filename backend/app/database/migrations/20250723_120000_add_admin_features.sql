-- Migration: Add admin features and user activity tracking
-- Created: 2025-07-23
-- Description: Add admin users, roles, user activity tracking, and analytics support

-- Create admin roles enum if not exists
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator', 'analyst');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role admin_role NOT NULL DEFAULT 'analyst',
    is_active BOOLEAN DEFAULT TRUE,
    created_by_admin_id INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for admin users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- login, logout, practice_start, practice_complete, etc.
    activity_data JSONB, -- Additional activity-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user activity
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_created ON user_activity(user_id, created_at DESC);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- System analytics aggregated data
CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    stat_date DATE UNIQUE NOT NULL,
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0, -- Users who logged in on this day
    total_sessions INTEGER DEFAULT 0,
    total_routines_completed INTEGER DEFAULT 0,
    avg_session_duration_minutes DECIMAL(10,2) DEFAULT 0,
    popular_asanas JSONB, -- Top 10 asanas used this day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for daily stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date DESC);

-- Add is_admin column to existing users table if needed
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add user tracking columns to existing users table
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create initial super admin user (password: admin123 - should be changed immediately)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (email, name, hashed_password, role, is_active)
VALUES (
    'admin@yogastudio.ecitizen.media',
    'System Administrator',
    '$2b$12$LQv3c1yqBFVyhumFWOhIguPQ8nq9Jw4UiZK8QW/J3W5w2Vc6y0lbO', -- admin123
    'super_admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON daily_stats;
CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats_view AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.is_active,
    u.created_at,
    u.last_login_at,
    u.login_count,
    u.last_activity_at,
    COALESCE(routine_stats.total_routines, 0) as total_routines,
    COALESCE(routine_stats.completed_routines, 0) as completed_routines,
    COALESCE(feedback_stats.avg_rating, 0) as avg_rating,
    CASE 
        WHEN u.last_activity_at > NOW() - INTERVAL '7 days' THEN 'active'
        WHEN u.last_activity_at > NOW() - INTERVAL '30 days' THEN 'inactive'
        ELSE 'dormant'
    END as user_status
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_routines,
        COUNT(CASE WHEN is_completed THEN 1 END) as completed_routines
    FROM routines
    GROUP BY user_id
) routine_stats ON u.id = routine_stats.user_id
LEFT JOIN (
    SELECT 
        user_id,
        AVG(rating::decimal) as avg_rating
    FROM feedback
    WHERE rating IS NOT NULL
    GROUP BY user_id
) feedback_stats ON u.id = feedback_stats.user_id;

COMMENT ON TABLE admin_users IS 'Administrative users with different roles and permissions';
COMMENT ON TABLE user_activity IS 'Tracks all user activities for analytics and monitoring';
COMMENT ON TABLE user_sessions IS 'Active user sessions for security and analytics';
COMMENT ON TABLE daily_stats IS 'Aggregated daily statistics for the platform';
COMMENT ON VIEW user_stats_view IS 'Comprehensive user statistics for admin dashboard';