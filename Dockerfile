# Base image
FROM node:18-slim as builder
WORKDIR /app

# install the required build packages that are not in slim image and pnpm
RUN apt-get update && apt-get install -y curl git build-essential python3
RUN npm install -g pnpm

# Copy only whats needed for dependencies & Install
COPY package*.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

# copy the rest application code
COPY . .

RUN pnpm build

# Runner state to only copy the required code
FROM node:18-slim as runner

WORKDIR /app

COPY --from=builder ./app/dist ./dist
COPY --from=builder ./app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Expose the port your app listens on
# Backedn code has port 3002
EXPOSE 3001

# Run the application in DEV mode
CMD ["node", "dist/app.js"]
