FROM node:lts-slim

LABEL org.opencontainers.image.source=https://github.com/ruchira088/video-downloader-front-end

WORKDIR /opt/front-end

COPY package.json .
COPY package-lock.json .

RUN npm i

COPY . .

EXPOSE 5173

CMD ["npm", "run", "start:dev"]
