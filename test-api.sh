#!/bin/bash

# Test API response for color field
# Run this on your VPS

echo "=================================="
echo "Testing API Response"
echo "=================================="
echo ""

echo "Making API request to get tasks..."
echo ""

curl -s "http://localhost:3000/api/projects/2/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.[0]' | grep -A 2 -B 2 color

echo ""
echo "=================================="
echo "If you see color field above, it's working!"
echo "If not, the backend isn't returning it."
echo "=================================="
