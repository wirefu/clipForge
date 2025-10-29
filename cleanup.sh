#!/bin/bash

echo "🧹 Cleaning up ClipForge processes..."

# Kill all Electron processes
pkill -f "electron" 2>/dev/null || true

# Kill all Node.js processes related to clipforge
pkill -f "clipforge" 2>/dev/null || true

# Kill any processes using ports 5173, 5174, 5175
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
lsof -ti:5175 | xargs kill -9 2>/dev/null || true

echo "✅ Cleanup complete!"
echo "📊 Remaining processes:"
ps aux | grep -E "(electron|node)" | grep clipforge | grep -v grep | wc -l | xargs echo "Processes:"
