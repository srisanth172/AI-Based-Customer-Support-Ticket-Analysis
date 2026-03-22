#!/usr/bin/env python
"""Test the chatbot API"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app

def test_chatbot():
    """Test chatbot endpoint"""
    client = app.test_client()
    
    # Test 1: Basic message
    print("Test 1: Basic chatbot message")
    response = client.post('/chatbot', 
        json={'message': 'Hello, I need help'},
        headers={'Origin': 'http://localhost:3000', 'Content-Type': 'application/json'}
    )
    print(f"  Status: {response.status_code}")
    print(f"  CORS Header Present: {'Access-Control-Allow-Origin' in response.headers}")
    print(f"  Response: {response.json if response.status_code == 200 else response.data}")
    print()
    
    # Test 2: OPTIONS preflight (CORS)
    print("Test 2: CORS preflight request")
    response = client.options('/chatbot',
        headers={
            'Origin': 'https://ai-based-customer-support-ticket-08g3.onrender.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
        }
    )
    print(f"  Status: {response.status_code}")
    print(f"  Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    print(f"  Allow-Methods: {response.headers.get('Access-Control-Allow-Methods', 'NOT SET')}")
    print(f"  Allow-Headers: {response.headers.get('Access-Control-Allow-Headers', 'NOT SET')}")
    print()
    
    # Test 3: Message with ticket ID
    print("Test 3: Message with ticket lookup")
    response = client.post('/chatbot',
        json={'message': 'What is the status of TKT-ABC123?'},
        headers={'Origin': 'http://localhost:3000', 'Content-Type': 'application/json'}
    )
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.get_json()
        if data:
            print(f"  Response: {data.get('response', 'No response')[:100]}...")
        else:
            print(f"  Response: Invalid JSON")
    else:
        print(f"  Error: {response.data}")
    print()
    
    print("✅ All basic tests completed!")

if __name__ == '__main__':
    test_chatbot()
