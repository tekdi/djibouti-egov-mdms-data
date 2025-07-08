# Multi-stage build for the Vite app using Bun
FROM oven/bun:1 AS app-build

# Set working directory for app build
WORKDIR /app

# Copy app package files
COPY app/package.json app/bun.lockb ./

# Install app dependencies
RUN bun install --frozen-lockfile

# Copy app source code
COPY app/ ./

# Build the Vite app
RUN bun run build

# Production stage with the existing Express server
FROM oven/bun:1 AS production

# Install basic utilities
RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy server package.json and install server dependencies
COPY server/package.json ./
RUN bun install

# Copy server source code
COPY server/ ./

# Copy built app from the build stage to be served by the server
COPY --from=app-build /app/dist ./public/app

# Create a startup script to ensure proper serving
RUN echo '#!/bin/bash\n\
echo "Starting visualization server with Bun..."\n\
echo "Server will serve the built app from /public/app"\n\
echo "Available at: http://0.0.0.0:8001"\n\
exec bun run server.js' > start.sh && \
    chmod +x start.sh

# Expose the port (assuming the server uses 8001 based on the original Dockerfile)
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8001/ || exit 1

# Start the server
CMD ["./start.sh"] 