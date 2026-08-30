# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY docs ./docs
COPY .sequelizerc ./

RUN mkdir -p /app/uploads/events && chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
