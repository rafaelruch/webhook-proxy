FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY webhook-chatwoot.js .
EXPOSE 3002
CMD ["npm", "start"]
