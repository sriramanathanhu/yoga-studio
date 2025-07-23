#!/bin/bash

# Docker-based user creation script for YogaStudio
# Creates a new user account using the backend container

set -e

echo "🧘 YogaStudio User Creation Tool (Docker Edition)"
echo "=" * 50

# Check if backend container is running
if ! docker ps | grep -q "yogastudio-backend"; then
    echo "❌ Backend container is not running!"
    echo "Please start the services first: docker-compose up -d"
    exit 1
fi

# Function to create user interactively
create_user_interactive() {
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
    
    # Use the backend container to create the user
    docker exec -it yogastudio-backend-1 python -c "
import sys
import os
sys.path.append('/app')

from app.database.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.core.validation import InputValidator

def create_user():
    email = '$email'
    name = '$name'
    password = '$password'
    
    try:
        # Validate inputs
        validated_email = InputValidator.validate_email(email)
        validated_name = InputValidator.validate_name(name)
        validated_password = InputValidator.validate_password(password)
    except Exception as e:
        print(f'❌ Validation error: {e}')
        return False
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == validated_email).first()
        if existing_user:
            print(f'❌ User with email {validated_email} already exists!')
            return False
        
        # Create new user
        hashed_password = get_password_hash(validated_password)
        new_user = User(
            email=validated_email,
            name=validated_name,
            hashed_password=hashed_password,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f'✅ User account created successfully!')
        print(f'📧 Email: {new_user.email}')
        print(f'👤 Name: {new_user.name}')
        print(f'🆔 User ID: {new_user.id}')
        print(f'📅 Created: {new_user.created_at}')
        
        return True
        
    except Exception as e:
        print(f'❌ Database error: {e}')
        db.rollback()
        return False
        
    finally:
        db.close()

if create_user():
    print('')
    print('🎉 You can now login to the YogaStudio application!')
    print('🌐 Visit: https://yogastudio.ecitizen.media')
else:
    print('')
    print('❌ Failed to create user account')
    exit(1)
"
}

# Function to list existing users
list_users() {
    echo "📋 Listing existing users..."
    
    docker exec yogastudio-backend-1 python -c "
import sys
sys.path.append('/app')

from app.database.database import SessionLocal
from app.models.user import User

db = SessionLocal()

try:
    users = db.query(User).all()
    
    if not users:
        print('📝 No users found in database')
    else:
        print(f'📋 Found {len(users)} user(s):')
        print('-' * 60)
        for user in users:
            print(f'🆔 ID: {user.id}')
            print(f'📧 Email: {user.email}')
            print(f'👤 Name: {user.name}')
            print(f'✅ Active: {user.is_active}')
            print(f'📅 Created: {user.created_at}')
            print('-' * 60)
            
except Exception as e:
    print(f'❌ Database error: {e}')
    
finally:
    db.close()
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
        create_user_interactive
        ;;
esac