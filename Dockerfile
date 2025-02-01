# Base image
#FROM node:18

FROM node:18 as build
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm i
COPY . .
RUN pnpm build

##############
FROM node:18-slim
WORKDIR /app
RUN npm install -g pnpm
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
RUN pnpm install
ENV PORT=3002
EXPOSE 3002

CMD ["pnpm", "dev"]