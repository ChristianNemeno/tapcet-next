FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --legacy-peer-deps
COPY server/ ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app


COPY server/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps


COPY --from=server-builder /app/server/dist ./dist

COPY --from=server-builder /app/server/drizzle ./drizzle

EXPOSE 3001
CMD ["node", "dist/index.js"]
