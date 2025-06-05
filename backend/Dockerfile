FROM node:14 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

FROM node:14 AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM node:14-slim
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "src/app.js"]

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}