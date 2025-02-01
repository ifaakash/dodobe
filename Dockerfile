# Base image
#FROM node:18

FROM node:18 as build
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm i
COPY . .
ENV PORT=3001 #backedn code has port 3002
EXPOSE 3001

CMD ["pnpm", "dev"]