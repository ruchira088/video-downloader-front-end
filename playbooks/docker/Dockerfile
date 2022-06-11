FROM nginx:stable-alpine

COPY ./playbooks/docker/default.conf /etc/nginx/conf.d/default.conf

COPY ./build /opt/video-downloader-front-end

EXPOSE 80
