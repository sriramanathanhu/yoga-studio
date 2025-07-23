#!/usr/bin/env python3

"""
User creation script for YogaStudio
Creates a new user account directly in the database
"""

import sys
import os
import getpass
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

try:
    from app.database.database import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    from app.core.validation import InputValidator
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the yogastudio directory")
    sys.exit(1)

def create_user_account():
    """Create a new user account interactively"""
    print("🧘 YogaStudio User Creation Tool")
    print("=" * 40)
    
    # Get user inputs
    email = input("Enter email address: ").strip()
    name = input("Enter your name: ").strip()
    
    # Get password securely
    password = getpass.getpass("Enter password: ")
    password_confirm = getpass.getpass("Confirm password: ")
    
    if password != password_confirm:
        print("❌ Passwords don't match!")
        return False
    
    # Validate inputs
    try:
        validated_email = InputValidator.validate_email(email)
        validated_name = InputValidator.validate_name(name)
        validated_password = InputValidator.validate_password(password)
    except ValueError as e:
        print(f"❌ Validation error: {e}")
        return False
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == validated_email).first()
        if existing_user:
            print(f"❌ User with email {validated_email} already exists!")
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
        
        print(f"✅ User account created successfully!")
        print(f"📧 Email: {new_user.email}")
        print(f"👤 Name: {new_user.name}")
        print(f"🆔 User ID: {new_user.id}")
        print(f"📅 Created: {new_user.created_at}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

def list_existing_users():
    """List all existing users"""
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        
        if not users:
            print("📝 No users found in database")
            return
        
        print(f"📋 Found {len(users)} user(s):")
        print("-" * 60)
        for user in users:
            print(f"🆔 ID: {user.id}")
            print(f"📧 Email: {user.email}")
            print(f"👤 Name: {user.name}")
            print(f"✅ Active: {user.is_active}")
            print(f"📅 Created: {user.created_at}")
            print("-" * 60)
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_existing_users()
    else:
        if create_user_account():
            print("\n🎉 You can now login to the YogaStudio application!")
            print("🌐 Visit: https://yogastudio.ecitizen.media")
        else:
            print("\n❌ Failed to create user account")
            sys.exit(1)