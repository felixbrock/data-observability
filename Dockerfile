# syntax=docker/dockerfile:1
FROM public.ecr.aws/lambda/nodejs:16
ARG ENV
ENV NODE_ENV=$ENV
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
CMD [ "dist/lambda.handler" ]