FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY webhook-proxy.js .
EXPOSE 3001
CMD ["node", "webhook-proxy.js"]
