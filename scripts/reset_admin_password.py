#!/usr/bin/env python3
"""
Script to reset admin password for Yoga Studio AI
Usage: python reset_admin_password.py [email] [new_password]
"""

import sys
import os
sys.path.append('/app')

from app.core.security import get_password_hash
from app.database.database import SessionLocal
from app.models.admin import AdminUser


def reset_admin_password(email, new_password):
    """Reset admin user password"""
    try:
        # Create new password hash
        new_hash = get_password_hash(new_password)
        
        # Update the admin user
        db = SessionLocal()
        admin = db.query(AdminUser).filter(AdminUser.email == email).first()
        
        if admin:
            admin.hashed_password = new_hash
            db.commit()
            print(f'✅ Password updated successfully for {email}')
            return True
        else:
            print(f'❌ Admin user not found: {email}')
            return False
            
    except Exception as e:
        print(f'❌ Error updating password: {e}')
        return False
    finally:
        db.close()


def create_admin_user(email, name, password, role='super_admin'):
    """Create a new admin user"""
    try:
        from app.core.admin_security import create_admin_user as create_admin
        
        db = SessionLocal()
        
        # Check if admin already exists
        existing = db.query(AdminUser).filter(AdminUser.email == email).first()
        if existing:
            print(f'❌ Admin user already exists: {email}')
            return False
        
        # Create new admin
        admin = create_admin(db, email, name, password, role, None)
        print(f'✅ Created new admin user: {email} ({role})')
        return True
        
    except Exception as e:
        print(f'❌ Error creating admin user: {e}')
        return False
    finally:
        db.close()


def list_admin_users():
    """List all admin users"""
    try:
        db = SessionLocal()
        admins = db.query(AdminUser).all()
        
        print("📋 Current Admin Users:")
        print("-" * 60)
        for admin in admins:
            status = "Active" if admin.is_active else "Inactive"
            print(f"ID: {admin.id} | {admin.email} | {admin.name}")
            print(f"Role: {admin.role} | Status: {status}")
            print(f"Created: {admin.created_at}")
            print("-" * 60)
            
    except Exception as e:
        print(f'❌ Error listing admin users: {e}')
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Reset password: python reset_admin_password.py reset [email] [new_password]")
        print("  Create admin:   python reset_admin_password.py create [email] [name] [password] [role]")
        print("  List admins:    python reset_admin_password.py list")
        print("")
        print("Examples:")
        print("  python reset_admin_password.py reset admin@yogastudio.ecitizen.media newpassword123")
        print("  python reset_admin_password.py create john@example.com 'John Doe' password123 moderator")
        print("  python reset_admin_password.py list")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "reset":
        if len(sys.argv) != 4:
            print("❌ Usage: python reset_admin_password.py reset [email] [new_password]")
            sys.exit(1)
        
        email = sys.argv[2]
        new_password = sys.argv[3]
        reset_admin_password(email, new_password)
        
    elif command == "create":
        if len(sys.argv) < 5:
            print("❌ Usage: python reset_admin_password.py create [email] [name] [password] [role=super_admin]")
            sys.exit(1)
        
        email = sys.argv[2]
        name = sys.argv[3]
        password = sys.argv[4]
        role = sys.argv[5] if len(sys.argv) > 5 else 'super_admin'
        
        create_admin_user(email, name, password, role)
        
    elif command == "list":
        list_admin_users()
        
    else:
        print(f"❌ Unknown command: {command}")
        print("Available commands: reset, create, list")
        sys.exit(1)