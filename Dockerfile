# ── Stage 1: Build Next.js client ─────────────────────────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Build Express server ─────────────────────────────────────────────
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Server production deps
COPY server/package*.json ./
RUN npm ci --omit=dev

# Compiled server
COPY --from=server-builder /app/server/dist ./dist

# Drizzle migrations
COPY --from=server-builder /app/server/drizzle ./drizzle

EXPOSE 3001
CMD ["node", "dist/index.js"]
