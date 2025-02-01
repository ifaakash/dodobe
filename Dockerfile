FROM node:18.20 as builder

WORKDIR /backend

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --shamefully-hoist

COPY . .

FROM node:18-alpine as runner

WORKDIR /backend

COPY --from=builder /backend /backend

ENV PORT=3002
EXPOSE 3002

# Run the app
CMD ["pnpm", "dev"]