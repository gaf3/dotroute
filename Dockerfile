FROM node:22.9.0-alpine3.20

RUN mkdir -p /opt/service

WORKDIR /opt/service

COPY package.json package-lock.json ./

RUN npm ci

COPY src src
