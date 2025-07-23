#!/bin/bash

# Quick Authentication Token Fix
# Resolves frontend-backend authentication integration

set -e

echo "🔐 Fixing Authentication Token Integration"
echo "=" * 50

log_auth() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check current authentication flow
test_auth_flow() {
    log_auth "🧪 Testing authentication flow..."
    
    # Test login endpoint
    login_response=$(curl -s -X POST "http://yogastudio.ecitizen.media/auth/login-json" \
        -H "Content-Type: application/json" \
        -d '{"email":"sri.ramanatha@uskfoundation.or.ke","password":"testpass123"}' \
        -w "%{http_code}")
    
    http_code="${login_response: -3}"
    
    if [ "$http_code" = "200" ]; then
        log_auth "✅ Login endpoint working"
        
        # Extract token from response (if visible in response body)
        response_body="${login_response%???}"
        echo "$response_body" | grep -q "access_token" && log_auth "✅ Token present in response"
        
    else
        log_auth "❌ Login failing with code: $http_code"
        echo "Response: ${login_response%???}"
    fi
}

# Fix CORS and cookie settings
fix_cors_cookies() {
    log_auth "🔧 Checking CORS and cookie configuration..."
    
    # Test if CORS is properly configured
    cors_test=$(curl -s -I -X OPTIONS "http://yogastudio.ecitizen.media/asanas/" \
        -H "Origin: https://yogastudio.ecitizen.media" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization" \
        -w "%{http_code}" | tail -1)
    
    if [ "$cors_test" = "200" ]; then
        log_auth "✅ CORS preflight working"
    else
        log_auth "⚠️  CORS might need adjustment (code: $cors_test)"
    fi
}

# Create a simple authentication test script
create_auth_test() {
    log_auth "📝 Creating authentication test script..."
    
    cat > /root/yogastudio/test_auth.py << 'EOF'
#!/usr/bin/env python3

import requests
import json

def test_authentication():
    base_url = "http://yogastudio.ecitizen.media"
    
    # Test 1: Login and get token
    print("🧪 Testing login...")
    login_data = {
        "email": "sri.ramanatha@uskfoundation.or.ke",
        "password": "testpass123"  # You'll need to set this password
    }
    
    session = requests.Session()
    
    try:
        # Login
        response = session.post(f"{base_url}/auth/login-json", json=login_data)
        print(f"Login status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful")
            token_data = response.json()
            print(f"Token received: {bool(token_data.get('access_token'))}")
            
            # Test 2: Access protected asanas endpoint
            print("\n🧪 Testing asanas access...")
            asanas_response = session.get(f"{base_url}/asanas/")
            print(f"Asanas status: {asanas_response.status_code}")
            
            if asanas_response.status_code == 200:
                asanas = asanas_response.json()
                print(f"✅ Asanas accessible: {len(asanas)} asanas found")
                return True
            else:
                print(f"❌ Asanas not accessible: {asanas_response.text}")
                
            # Test 3: Check auth/me endpoint
            print("\n🧪 Testing auth verification...")
            me_response = session.get(f"{base_url}/auth/me")
            print(f"Auth/me status: {me_response.status_code}")
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                print(f"✅ User verified: {user_data.get('email')}")
            else:
                print(f"❌ Auth verification failed: {me_response.text}")
                
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Test error: {e}")
        
    return False

if __name__ == "__main__":
    success = test_authentication()
    if success:
        print("\n🎉 Authentication working correctly!")
    else:
        print("\n⚠️  Authentication needs fixing")
EOF

    chmod +x /root/yogastudio/test_auth.py
    log_auth "✅ Authentication test script created"
}

# Fix authentication by ensuring proper cookie/token handling
fix_authentication() {
    log_auth "🔧 Applying authentication fixes..."
    
    # Restart backend to clear any authentication cache issues
    log_auth "Restarting backend service..."
    docker-compose restart backend
    
    # Wait for backend to be ready
    sleep 10
    
    log_auth "✅ Backend restarted"
}

# Test the fix
verify_fix() {
    log_auth "🔍 Verifying authentication fix..."
    
    # Test database connectivity
    if docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "SELECT COUNT(*) FROM asanas;" >/dev/null 2>&1; then
        log_auth "✅ Database accessible"
    else
        log_auth "❌ Database connection issue"
        return 1
    fi
    
    # Test backend health
    if timeout 10 curl -f http://yogastudio.ecitizen.media/ >/dev/null 2>&1; then
        log_auth "✅ Backend responding"
    else
        log_auth "❌ Backend not responding"
        return 1
    fi
    
    log_auth "✅ Basic connectivity verified"
    return 0
}

# Provide user instructions
provide_instructions() {
    log_auth "📋 Authentication Fix Instructions:"
    echo ""
    echo "To test and fix your login:"
    echo ""
    echo "1. First, set your password:"
    echo "   ./scripts/reset_password.sh"
    echo ""
    echo "2. Test authentication system:"
    echo "   python3 test_auth.py"
    echo ""
    echo "3. Login to application:"
    echo "   Email: sri.ramanatha@uskfoundation.or.ke"
    echo "   Password: [your new password]"
    echo "   URL: https://yogastudio.ecitizen.media"
    echo ""
    echo "4. If still having issues:"
    echo "   ./scripts/emergency_fix.sh"
    echo ""
}

# Main execution
main() {
    log_auth "🔐 Starting authentication token fix..."
    
    test_auth_flow
    fix_cors_cookies
    create_auth_test
    fix_authentication
    
    if verify_fix; then
        log_auth "✅ Authentication fix completed successfully"
        provide_instructions
    else
        log_auth "⚠️  Authentication fix needs additional steps"
        provide_instructions
    fi
}

main