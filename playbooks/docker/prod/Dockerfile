FROM nginx:stable-alpine

LABEL org.opencontainers.image.source=https://github.com/ruchira088/video-downloader-front-end

COPY ./playbooks/docker/prod/default.conf /etc/nginx/conf.d/default.conf

COPY ./build/csp.conf /opt/csp.conf
COPY ./build/client /opt/video-downloader-front-end

EXPOSE 80
