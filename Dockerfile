# alpine image for less size - TESTING
FROM node:18.20-alpine as builder

# mention workdir inside container
WORKDIR /app

# copy dependencies file
COPY package*.json ./

RUN npm install -g pnpm && pnpm i

# copy app code
COPY . .

ENV PORT=3002

# live on 3001 port - TESTING
EXPOSE 3002

# run the application on dev dependencies
CMD ["pnpm","dev"]