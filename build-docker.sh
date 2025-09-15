#!/bin/bash

# Build script for MemoAI Docker container

echo "🐳 Building MemoAI Docker container..."

# Build the Docker image
docker build -t memoai:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "🚀 To run the container:"
    echo "   docker run -p 3000:3000 memoai:latest"
    echo ""
    echo "🔧 Or use docker-compose:"
    echo "   docker-compose up"
else
    echo "❌ Docker build failed!"
    exit 1
fi
