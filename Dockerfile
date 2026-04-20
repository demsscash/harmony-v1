# ── Stage 1: Build ────────────────────────────
FROM node:22-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config + lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build API (TypeScript → dist/)
RUN cd apps/api && npx tsc

# Build Web (Next.js)
RUN cd apps/web && npm run build

# ── Stage 2: API image ────────────────────────
FROM node:22-alpine AS api
RUN npm install -g pnpm
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]

# ── Stage 3: Web image ────────────────────────
FROM node:22-alpine AS web
RUN npm install -g pnpm
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
