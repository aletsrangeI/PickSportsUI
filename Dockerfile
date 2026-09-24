# Etapa 1: Build de la aplicación Vite con Node.js
FROM node:22-alpine AS builder
WORKDIR /app

# Instalar dependencias aprovechando la caché
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar
COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero Nginx Alpine
FROM nginx:alpine AS runner

# Copiar el build compilado
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
