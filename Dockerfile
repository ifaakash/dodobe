FROM node:18.20-alpine as builder

WORKDIR /app

RUN rm -rf /app/*

COPY package*.json ./

RUN npm install -g pnpm && pnpm install --shamefully-hoist

COPY . .

ENV PORT=3002
EXPOSE 3002

CMD ["pnpm", "dev"]