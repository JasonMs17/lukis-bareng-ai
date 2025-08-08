FROM nginx:1.27-alpine

COPY . /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

