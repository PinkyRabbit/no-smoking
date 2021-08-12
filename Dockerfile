FROM node:14 AS base
WORKDIR /app
COPY package.json ./

FROM base AS development
COPY index.js ./
RUN npm install -s
CMD ["npm", "run", "start:debug"]

FROM base AS production
COPY app ./app
RUN npm install --production
CMD ["npm", "start"]
