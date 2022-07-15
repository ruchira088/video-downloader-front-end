FROM nginx:stable-alpine

LABEL org.opencontainers.image.source https://github.com/ruchira088/video-downloader-front-end

COPY ./playbooks/docker/default.conf /etc/nginx/conf.d/default.conf

COPY ./build /opt/video-downloader-front-end

EXPOSE 80
