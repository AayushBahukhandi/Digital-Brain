#!/bin/sh

echo "Starting Digital Brain application..."

# Set environment variables
export NODE_ENV=production
export PORT=3001

echo "Backend will run on port: $PORT"

# Navigate to backend directory
cd /app/backend

# Check if backend files exist
echo "Checking backend files..."
ls -la dist/

# Start backend with proper error handling
echo "Starting backend server on port 3001..."
node dist/index.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Backend started successfully with PID $BACKEND_PID"
else
    echo "Backend failed to start!"
    exit 1
fi

# Test backend health
echo "Testing backend health..."
timeout 10 sh -c 'until nc -z localhost 3001; do sleep 1; done' || {
    echo "Backend health check failed!"
    exit 1
}

echo "Backend is healthy, starting nginx..."

# Start nginx in foreground
exec nginx -g "daemon off;"