# Base image
FROM node:18-slim
WORKDIR /app

# install the required build packages that are not in slim image and pnpm
RUN apt-get update && apt-get install -y curl git build-essential python3
RUN npm install -g pnpm

# Copy and install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN pnpm i

# copy the rest application code
COPY . .

#backedn code has port 3002
EXPOSE 3001

# Run the application in DEV mode
CMD ["pnpm", "dev"]