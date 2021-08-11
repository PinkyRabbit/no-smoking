FROM node:14 AS base
WORKDIR /app
COPY package.json ./
COPY .env.sample ./
RUN npm install -s
CMD ["npm", "run", "start:debug"]

FROM node:14 AS production
WORKDIR /app
COPY package.json ./
COPY app ./app
RUN npm install --production
CMD ["npm", "start"]
