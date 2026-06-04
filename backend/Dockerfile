# Playwright base image ships Chromium + system deps (needed by crawler.service.ts).
# Keep the tag in sync with the "playwright" version in package.json.
FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app
ENV NODE_ENV=production

# Install deps (incl. dev deps — tsc + prisma CLI are needed for the build)
COPY package*.json ./
RUN npm ci

# Build: generate Prisma client, then compile TS -> dist/
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3001

# Apply pending migrations against Neon, then start the compiled server.
# DIRECT_URL is used for migrate deploy; DATABASE_URL (pooled) for runtime.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
