#!/bin/bash

# Navigate to the repository root (2 levels up from tools/viz)
cd "$(dirname "$0")/../.."

# Build the Docker image using the Dockerfile in tools/viz but with repository root as context
echo "Building visualization server with app..."
docker build -f tools/viz/Dockerfile -t viz-server:latest .

# Stop and remove existing container if it exists
echo "Stopping existing container..."
docker stop viz-server-container 2>/dev/null || true
docker rm viz-server-container 2>/dev/null || true

# Run the container
echo "Starting visualization server..."
docker run -d \
  --name viz-server-container \
  -p 8001:8001 \
  --restart unless-stopped \
  viz-server:latest

echo "Visualization server started!"
echo "Access the server at: http://localhost:8001"
echo "Built React app will be served at: http://localhost:8001/"
echo ""
echo "Available endpoints:"
echo "  - Built React app: http://localhost:8001/"
echo "  - Data browser: http://localhost:8001/data"
echo "  - API proxy: http://localhost:8001/api/*"
echo "  - Legacy files: http://localhost:8001/*.html (if not built)"
echo ""
echo "To view logs: docker logs -f viz-server-container"
echo "To stop: docker stop viz-server-container"
echo "To rebuild: docker build -f tools/viz/Dockerfile -t viz-server:latest . && docker restart viz-server-container" 