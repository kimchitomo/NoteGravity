# Stage 1: Build the Web App
FROM node:20-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration and lockfiles
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY apps/web/ ./apps/web/
COPY apps/server/ ./apps/server/

# Build Web and Server
RUN pnpm --filter web run build
RUN pnpm --filter server run build

# Stage 2: Production Server + Rclone for Backups
FROM node:20-alpine

# Install rclone, cron, and sqlite dependencies
RUN apk add --no-cache rclone dcron sqlite bash curl ca-certificates tzdata

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy server files
COPY --from=builder /app/apps/server/package.json /app/apps/server/pnpm-lock.yaml* ./
COPY --from=builder /app/apps/server/dist ./dist

# We only need production dependencies for the server
RUN pnpm install --prod

# Copy compiled web app to web/dist (server serves from ../../web/dist relative to its execution path, 
# wait, index.js is in /app/dist/index.js. So it looks for path.join(__dirname, '../../web/dist').
# __dirname is /app/dist. So '../../web/dist' is /web/dist. 
# Let's adjust server's path or copy web dist to /web/dist.
COPY --from=builder /app/apps/web/dist /web/dist

# Setup backup script and cron
COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh
# Run backup daily at 2:00 AM
RUN echo "0 2 * * * /app/backup.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Create data directory
RUN mkdir -p /data/uploads

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start crond in background and then start node server
CMD crond -b && node dist/index.js
