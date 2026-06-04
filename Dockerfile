# ── Etapa 1: instalar dependencias ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Etapa 2: compilar la app ─────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Etapa 3: imagen de producción (solo lo necesario) ────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# El modo standalone genera un server.js autónomo
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
# Si tienes carpeta public descomenta la siguiente línea:
# COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
