#!/bin/bash

# Simple user creation script using direct SQL
# Creates a new user account directly in PostgreSQL

set -e

echo "🧘 YogaStudio User Creation Tool (SQL Edition)"
echo "=" * 50

# Check if database container is running
if ! docker ps | grep -q "yogastudio-db"; then
    echo "❌ Database container is not running!"
    echo "Please start the services first: docker-compose up -d"
    exit 1
fi

# Function to create user with SQL
create_user_with_sql() {
    echo "Creating new user account..."
    echo ""
    
    # Get user inputs
    read -p "Enter email address: " email
    read -p "Enter your name: " name
    read -s -p "Enter password: " password
    echo ""
    read -s -p "Confirm password: " password_confirm
    echo ""
    
    if [ "$password" != "$password_confirm" ]; then
        echo "❌ Passwords don't match!"
        exit 1
    fi
    
    # Basic validation
    if [[ ! "$email" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
        echo "❌ Invalid email format!"
        exit 1
    fi
    
    if [ ${#password} -lt 8 ]; then
        echo "❌ Password must be at least 8 characters long!"
        exit 1
    fi
    
    # Check if user already exists
    existing_user=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users WHERE email = '$email';" | tr -d ' ')
    
    if [ "$existing_user" -gt 0 ]; then
        echo "❌ User with email $email already exists!"
        exit 1
    fi
    
    # Generate password hash using Python in backend container
    echo "🔐 Generating secure password hash..."
    password_hash=$(docker exec yogastudio-backend-1 python -c "
import sys
sys.path.append('/app')
from app.core.security import get_password_hash
print(get_password_hash('$password'))
")
    
    if [ -z "$password_hash" ]; then
        echo "❌ Failed to generate password hash!"
        exit 1
    fi
    
    # Insert user into database
    echo "💾 Creating user in database..."
    docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "
        INSERT INTO users (email, name, hashed_password, is_active, created_at) 
        VALUES ('$email', '$name', '$password_hash', true, NOW())
        RETURNING id, email, name, created_at;
    "
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ User account created successfully!"
        echo "🎉 You can now login to the YogaStudio application!"
        echo "🌐 Visit: https://yogastudio.ecitizen.media"
    else
        echo "❌ Failed to create user account in database!"
        exit 1
    fi
}

# Function to list existing users
list_users() {
    echo "📋 Listing existing users..."
    
    docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "
        SELECT 
            id as \"🆔 ID\",
            email as \"📧 Email\", 
            name as \"👤 Name\",
            is_active as \"✅ Active\",
            created_at as \"📅 Created\"
        FROM users 
        ORDER BY created_at DESC;
    "
}

# Parse command line arguments
case "${1:-}" in
    --list|-l)
        list_users
        ;;
    --help|-h)
        echo "Usage: $0 [--list|--help]"
        echo ""
        echo "Options:"
        echo "  --list, -l    List existing users"
        echo "  --help, -h    Show this help message"
        echo ""
        echo "Without options, creates a new user interactively"
        ;;
    *)
        create_user_with_sql
        ;;
esac