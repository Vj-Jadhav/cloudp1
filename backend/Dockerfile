# ========================================================
# Student Information Management System - Backend Container
# ========================================================
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src ./src

# Run as the unprivileged user that ships with the node image
USER node

# Render injects PORT at runtime; 5000 is the fallback used by server.js
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/server.js"]
