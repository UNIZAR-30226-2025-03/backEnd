# -------------------------------------------
# 1) Build Stage - compila NestJS (con tests)
# -------------------------------------------
    FROM node:22-alpine AS build
    WORKDIR /usr/src/app
    
    # Copiar y preparar dependencias
    COPY package*.json ./
    RUN npm install
    
    # 🔧 Copiar el esquema Prisma antes de generar
    COPY prisma ./prisma
    
    # 🔧 Generar Prisma Client
    RUN npx prisma generate
    
    # Copiar configuración y código fuente
    COPY tsconfig*.json nest-cli.json* ./
    COPY src ./src
    COPY test ./test
    
    # Ejecutar tests opcionalmente
    # RUN npm run test
    
    # Compilar proyecto
    RUN npm run build
    
    # -------------------------------------------
    # 2) Runtime + PM2
    # -------------------------------------------
    FROM keymetrics/pm2:18-alpine
    WORKDIR /usr/src/app
    
    COPY --from=build /usr/src/app/dist ./dist
    COPY --from=build /usr/src/app/node_modules ./node_modules
    COPY package*.json ./
    COPY .env ./
    
    EXPOSE 443
    CMD ["pm2-runtime", "npm", "--name", "nest-app", "--", "run", "start:prod"]
    