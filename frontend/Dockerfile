# Dockerfile frontend - Build Vite + Nginx
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# --- Image finale : Nginx ---
FROM nginx:alpine AS runner

# Copier le build
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx avec proxy API vers le backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
