# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies (delete package-lock.json to get correct native binaries for Alpine)
RUN rm -f package-lock.json && npm install

# Copy source code
COPY . .

# Build client and server
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

# Create entrypoint script to fix volume permissions at runtime
RUN printf '#!/bin/sh\n\
# Fix permissions on mounted volume (may be owned by root)\n\
if [ -d /app/data ] && [ "$(stat -c %%u /app/data)" = "0" ]; then\n\
  chown -R node:node /app/data 2>/dev/null || true\n\
fi\n\
exec su-exec node "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

# Install su-exec for dropping privileges
RUN apk add --no-cache su-exec

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3333
ENV DB_PATH=/app/data/tokens.db

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget -q --spider http://localhost:3333/health || exit 1

# Run as root initially to fix permissions, then drop to node
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist-server/index.js"]
