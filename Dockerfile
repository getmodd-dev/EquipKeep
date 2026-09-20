# ==========================================
# EquipKeep - Production Multi-Stage Dockerfile
# Optimized for GitHub Container Registry (GHCR) & Unraid
# Supports linux/amd64 and linux/arm64
# ==========================================

# Stage 1: Build Frontend Assets & Server Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install libc6-compat for native binary compatibility (e.g. esbuild) across amd64/arm64
RUN apk add --no-cache libc6-compat

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install all dependencies with --legacy-peer-deps to prevent React 19 peer conflict aborts
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code and build configurations
COPY . .

# Build Vite client and bundle server to dist/server.cjs
RUN npm run build

# Remove development dependencies to keep production footprint minimal
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 2: Production Minimal Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000

# Install curl for container health checks and tzdata for accurate scheduled task timezones
RUN apk add --no-cache curl tzdata

# Create directory for persistent Unraid appdata volume
RUN mkdir -p /app/data

# Copy production artifacts from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Declare persistent data volume (mapped to /mnt/user/appdata/equipkeep on Unraid)
VOLUME ["/app/data"]

# Expose Web Portal port
EXPOSE 3000

# Health check to ensure service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start bundled Express & Vite production server
CMD ["node", "dist/server.cjs"]
