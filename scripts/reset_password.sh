#!/bin/bash

# Password reset script for YogaStudio
# Resets password for an existing user account

set -e

echo "🔐 YogaStudio Password Reset Tool"
echo "=" * 40

# Check if database container is running
if ! docker ps | grep -q "yogastudio-db"; then
    echo "❌ Database container is not running!"
    echo "Please start the services first: docker-compose up -d"
    exit 1
fi

# Function to reset password
reset_password() {
    echo "Resetting password for existing user..."
    echo ""
    
    # Get user inputs
    read -p "Enter email address: " email
    read -s -p "Enter new password: " password
    echo ""
    read -s -p "Confirm new password: " password_confirm
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
    
    # Check if user exists
    existing_user=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users WHERE email = '$email';" | tr -d ' ')
    
    if [ "$existing_user" -eq 0 ]; then
        echo "❌ User with email $email does not exist!"
        echo "Available users:"
        docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "SELECT email FROM users;"
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
    
    # Update user password in database
    echo "💾 Updating password in database..."
    docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "
        UPDATE users 
        SET hashed_password = '$password_hash', updated_at = NOW()
        WHERE email = '$email'
        RETURNING id, email, name, updated_at;
    "
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Password reset successfully!"
        echo "🎉 You can now login with your new password!"
        echo "🌐 Visit: https://yogastudio.ecitizen.media"
    else
        echo "❌ Failed to reset password in database!"
        exit 1
    fi
}

# Show existing users first
echo "📋 Existing users in the system:"
docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "
    SELECT 
        email as \"📧 Email\", 
        name as \"👤 Name\",
        created_at as \"📅 Created\"
    FROM users 
    ORDER BY created_at DESC;
"

echo ""
reset_password