# QuickCard Ethiopia - Production Dockerfile
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install dependencies first for efficient layer caching
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy application source
COPY . .

# Ensure data directory has write permissions
RUN chown -R node:node /app

# Run as non-privileged user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

# Expose web port
EXPOSE 3000

# Start production server
CMD ["node", "server.js"]
