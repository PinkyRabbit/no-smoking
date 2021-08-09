FROM node:14 AS base
WORKDIR /app
COPY package.json ./
COPY .env ./
RUN npm install -s
CMD ["npm", "run", "start:dev"]
