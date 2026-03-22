#!/usr/bin/env python
"""Diagnostic script for chatbot API"""
import os
import sys
from importlib.metadata import version, PackageNotFoundError

# Check Python version
print(f"Python: {sys.version}")
print()

# Check if environment variables are loaded
print("=" * 60)
print("ENVIRONMENT VARIABLES CHECK")
print("=" * 60)
env_vars = [
    "OPENROUTER_API_KEY",
    "OPENROUTER_MODEL",
    "OPENROUTER_APP_NAME"
]
for var in env_vars:
    value = os.getenv(var, "NOT SET")
    if value and value != "NOT SET":
        # Mask the key
        field_value = f"{value[:20]}..." if len(value) > 20 else value
    else:
        field_value = value
    print(f"  {var}: {field_value}")
print()

# Check if Flask-CORS is installed
print("=" * 60)
print("DEPENDENCIES CHECK")
print("=" * 60)
try:
    import flask
    flask_version = version('flask')
    print(f"  Flask: {flask_version} ✓")
except ImportError:
    print("  Flask: NOT INSTALLED ✗")

try:
    import flask_cors
    cors_version = version('flask-cors')
    print(f"  Flask-CORS: {cors_version} ✓")
except (ImportError, PackageNotFoundError):
    print("  Flask-CORS: NOT INSTALLED ✗")

try:
    from flask import Flask
    from flask_cors import CORS
    print("  CORS Import: SUCCESS ✓")
except ImportError as e:
    print(f"  CORS Import: FAILED ✗ ({e})")
print()

# Check if backend app starts
print("=" * 60)
print("BACKEND APP CHECK")
print("=" * 60)
try:
    sys.path.insert(0, 'backend')
    from app import app
    print("  App Import: SUCCESS ✓")
    
    # Check if CORS is configured
    print(f"  CORS Configured: {'flask_cors' in str(type(getattr(app, '_cors', None)))} ✓")
    
    # Check routes
    routes = [rule.rule for rule in app.url_map.iter_rules()]
    chatbot_routes = [r for r in routes if 'chatbot' in r]
    print(f"  Chatbot Routes: {len(chatbot_routes)} found")
    for route in chatbot_routes[:3]:
        print(f"    - {route}")
    
except Exception as e:
    print(f"  App Import: FAILED ✗")
    print(f"  Error: {str(e)[:200]}")
    print()
    import traceback
    traceback.print_exc()

print()
print("=" * 60)
print("NEXT STEPS:")
print("=" * 60)
print("1. Verify all dependencies are installed: pip install Flask Flask-Cors")
print("2. Check environment variables are set in Render dashboard")
print("3. Deploy backend to Render with: git push")
print("4. Test chatbot endpoint: POST /chatbot with JSON: {'message': 'hello'}")
print("=" * 60)
