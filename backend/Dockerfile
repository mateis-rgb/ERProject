# Dockerfile backend - Node.js + Prisma + PostgreSQL client
FROM node:20-alpine AS builder

WORKDIR /app

# Installer les dépendances de build pour Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
RUN npm install --include=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Image finale ---
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat postgresql-client

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Créer les dossiers d'upload et backups
RUN mkdir -p /app/uploads /app/backups

EXPOSE 3001

# Au démarrage : migrations Prisma + seed + lancement
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/utils/seed.js 2>/dev/null; node dist/index.js"]
