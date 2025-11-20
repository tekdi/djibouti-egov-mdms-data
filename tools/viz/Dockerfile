# Multi-stage build for the Vite app using Bun
FROM oven/bun:1 AS app-build

# Set working directory for app build
WORKDIR /app

# Copy app package files (build context is repository root)
COPY tools/viz/app/package.json ./
COPY tools/viz/app/bun.lockb* ./

# Install app dependencies (will create/update lockfile as needed)
RUN bun install

# Copy app source code (build context is repository root)
COPY tools/viz/app/ ./

# Build the Vite app
RUN bun run build

# Production stage with the existing Express server
FROM oven/bun:1 AS production

# Install basic utilities, kubectl, and AWS CLI
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws/

# Verify installations
RUN kubectl version --client && aws --version

# Set working directory
WORKDIR /app

# Note: This Dockerfile is run from repository root with tools/viz/Dockerfile
# docker build -f tools/viz/Dockerfile -t viz-app . (from repository root)

# Copy the entire repository (build context is repository root)
COPY . ./

# Install server dependencies
WORKDIR /app/tools/viz/server
RUN bun install

# Copy built app from the build stage to be served by the server
COPY --from=app-build /app/dist ./public/app

# Create a startup script to ensure proper serving
RUN echo '#!/bin/bash\n\
echo "Starting visualization server with Bun..."\n\
echo "Server will serve the built app from /public/app"\n\
echo "Data directory available at: /app/data"\n\
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