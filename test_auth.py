#!/usr/bin/env python3

import requests
import json

def test_authentication():
    base_url = "http://yogastudio.ecitizen.media"
    
    # Test 1: Login and get token
    print("🧪 Testing login...")
    login_data = {
        "email": "sri.ramanatha@uskfoundation.or.ke",
        "password": "Yoga123!@#"  # Updated password
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
