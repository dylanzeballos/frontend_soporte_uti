# ─────────────────────────────────────────────
# Stage 1 – Builder
# ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install --legacy-peer-deps

COPY . .

# Vite lee .env.production automáticamente en build time
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 – Runner con nginx
# ─────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]