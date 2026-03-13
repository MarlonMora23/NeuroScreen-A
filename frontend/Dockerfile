FROM node:20-slim AS builder

ARG VITE_BASE
ARG VITE_API_URL

WORKDIR /app

ENV VITE_BASE=${VITE_BASE}
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginxinc/nginx-unprivileged:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080