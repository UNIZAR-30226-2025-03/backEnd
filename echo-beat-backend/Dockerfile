FROM node:22-alpine                    

WORKDIR /usr/src/app

# instalamos PM2 y deps de prod
COPY package*.json ./
RUN npm ci --omit=dev --no-progress && \
    npm install -g pm2@latest

COPY . .

EXPOSE 443
CMD ["pm2-runtime", "npm", "--name", "nest-app", "--", "run", "start:prod"]
