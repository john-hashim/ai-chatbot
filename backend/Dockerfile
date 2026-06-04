# Playwright base image ships Chromium + system deps (needed by crawler.service.ts).
# Keep the tag in sync with the "playwright" version in package.json.
FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

# Install ALL deps (incl. devDependencies — tsc, prisma CLI and the @types/*
# packages are needed to build). Do NOT set NODE_ENV=production here, or npm
# would omit devDependencies and the build would fail with TS7016 errors.
COPY package*.json ./
RUN npm ci --include=dev

# Build: generate Prisma client, then compile TS -> dist/
COPY . .
RUN npx prisma generate && npm run build

# Keep devDependencies installed: the `prisma` CLI (a devDependency) is used at
# container startup for `prisma migrate deploy`. NODE_ENV is set for runtime only.
ENV NODE_ENV=production
EXPOSE 3001

# Apply pending migrations against Neon, then start the compiled server.
# DIRECT_URL is used for migrate deploy; DATABASE_URL (pooled) for runtime.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
