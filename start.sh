#!/bin/bash
echo "Starting backend on port 3001..."
cd backend && node index.js &
BACKEND_PID=$!

echo "Starting frontend on port 5173..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Dashboard running at http://localhost:5173"
echo "Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
