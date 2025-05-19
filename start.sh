#!/bin/bash

# Display startup banner
echo "=========================================="
echo "  Starting Future Flight Aircraft Lookup"
echo "=========================================="
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo "=========================================="
echo ""

# Navigate to the project root directory
cd "$(dirname "$0")"

# Check if concurrently is installed
if ! npm list -g concurrently &> /dev/null; then
  echo "Installing concurrently package..."
  npm install
fi

# Start the application using npm script
npm start
