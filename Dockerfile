# Use official Node.js LTS image
FROM node:18-alpine

# Install git and cron
RUN apk add --no-cache git bash curl busybox-suid python3

# Set working directory
WORKDIR /app

# Copy package files for the Express server
COPY tools/viz/package*.json ./tools/viz/

# Install dependencies for the Express server
RUN cd tools/viz && npm install --production

# Copy the entire repository
COPY . .

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the port the Express server listens on
EXPOSE 8001

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Set environment variables if needed (optional)
# ENV NODE_ENV=production

# Start the Express server
CMD ["node", "tools/viz/server.js"] 