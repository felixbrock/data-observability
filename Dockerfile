# syntax=docker/dockerfile:1
FROM public.ecr.aws/lambda/nodejs:16

ENV NODE_ENV production

ENV LD_LIBRARY_PATH=/var/task/node_modules/canvas/build/Release:${LD_LIBRARY_PATH}

WORKDIR ${LAMBDA_TASK_ROOT}

COPY package.json package-lock.json .env ./
COPY dist ./dist

RUN npm install --omit=dev

CMD [ "dist/lambda.handler" ]