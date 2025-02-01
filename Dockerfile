FROM node:18-alpine as builder

WORKDIR /backend

RUN apk add --no-cache --virtual .build-deps python3 make g++ bash

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --shamefully-hoist

COPY . .

RUN apk del .build-deps

ENV PORT=3002
EXPOSE 3002

CMD ["pnpm", "dev"]
