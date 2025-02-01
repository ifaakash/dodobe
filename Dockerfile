# alpine image for less size - TESTING
FROM node:18.20-alpine as builder

# mention workdir inside container
WORKDIR /app

# copy dependencies file
COPY package*.json pnpm-local.yaml ./

# install package
RUN pnpm i

# copy app code
COPY . .

ENV PORT=3001

# live on 3001 port - TESTING
EXPOSE 3001

# run the application on dev dependencies
CMD ["pnpm","dev"]