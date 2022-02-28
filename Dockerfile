FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 9000
ENTRYPOINT npm run server
