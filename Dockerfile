FROM nginx:mainline-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY dist/nisix-utilities/browser /frontend
