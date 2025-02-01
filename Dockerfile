FROM node:18.20-alpine as builder

WORKDIR /backend

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --shamefully-hoist

COPY . .

ENV PORT=3002
EXPOSE 3002

CMD ["pnpm", "dev"]