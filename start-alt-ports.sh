#!/bin/bash

# Display startup banner
echo "=========================================="
echo "  Starting Future Flight Aircraft Lookup"
echo "=========================================="
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3001 (alternate port)"
echo "=========================================="
echo ""

# Navigate to the project root directory
cd "$(dirname "$0")"

# Start server
cd server
PORT=5001 npm start &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 2

# Start client with alternate port
cd ../client
PORT=3001 npm start &
CLIENT_PID=$!

# Function to handle script termination
cleanup() {
  echo "Stopping services..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  exit
}

# Set up trap to catch termination signals
trap cleanup INT TERM

# Keep script running
wait
