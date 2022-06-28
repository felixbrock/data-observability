# syntax=docker/dockerfile:1
FROM node:12.18.1
ARG ENV
ENV NODE_ENV=$ENV
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
CMD [ "node", "dist/index.js" ]