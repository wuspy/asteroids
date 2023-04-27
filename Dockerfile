FROM node:18-slim

RUN mkdir /.npm && chmod 777 /.npm

WORKDIR /usr/src/app

COPY --chmod=555 package*.json ./

RUN npm ci

COPY --chmod=555 . .

EXPOSE 8080
ENTRYPOINT npm run server
