"""
Quick test of team endpoints
"""
import requests

BASE_URL = "http://localhost:8000"

# Test health check
try:
    response = requests.get(f"{BASE_URL}/")
    print(f"✓ Health check: {response.status_code}")
except Exception as e:
    print(f"✗ Health check failed: {e}")

# Test team endpoints existence
endpoints = [
    "/api/teams/create",
    "/api/teams/my-teams",
    "/api/teams/invites",
]

for endpoint in endpoints:
    try:
        # OPTIONS request to check if endpoint exists
        response = requests.options(f"{BASE_URL}{endpoint}")
        print(f"✓ Endpoint {endpoint}: {response.status_code}")
    except Exception as e:
        print(f"✗ Endpoint {endpoint} failed: {e}")
