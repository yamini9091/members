#!/bin/bash

echo "🚀 Starting Complete Authentication System"
echo "==========================================="
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Check backend
echo "📦 Checking backend..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check frontend  
echo "📦 Checking frontend..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "✅ All dependencies installed"
echo ""
echo "🚀 START SERVICES IN SEPARATE TERMINALS:"
echo ""
echo "Terminal 1 - MongoDB:"
echo "  mongod"
echo ""
echo "Terminal 2 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 3 - Frontend:"
echo "  cd frontend && npm start"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
echo "Default test user:"
echo "  Email: test@example.com"
echo "  Password: password123"
