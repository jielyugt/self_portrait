#!/bin/bash

# Development server script for Portrait Generator
# Automatically detects and starts the best available local server

echo "🎨 Portrait Generator - Development Server"
echo "========================================"

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✅ Starting Python HTTP server on port 8000..."
    echo "📱 Open: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Starting Python HTTP server on port 8000..."
    echo "📱 Open: http://localhost:8000"  
    echo "🛑 Press Ctrl+C to stop"
    python -m http.server 8000
# Check if Node.js/npx is available
elif command -v npx &> /dev/null; then
    echo "✅ Starting Node.js server..."
    echo "📱 Server will display the URL when ready"
    echo "🛑 Press Ctrl+C to stop"
    npx serve . -p 8000
# Check if PHP is available  
elif command -v php &> /dev/null; then
    echo "✅ Starting PHP development server on port 8000..."
    echo "📱 Open: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop"
    php -S localhost:8000
else
    echo "❌ No suitable server found!"
    echo "Please install one of the following:"
    echo "  - Python: python -m http.server"
    echo "  - Node.js: npx serve"  
    echo "  - PHP: php -S localhost:8000"
    exit 1
fi
