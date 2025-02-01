# Base image
#FROM node:18

FROM node:20-slim as build
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./

FROM node:20-slim as pnpm_install
RUN npm install -g pnpm 

FROM node:20-slim as install_dependencies:
RUN pnpm i
COPY . .

# start in dev environment
CMD ["pnpm","dev"]