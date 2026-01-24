FROM node:lts

WORKDIR /app

ARG ENV_FILE=.env.production

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
COPY ${ENV_FILE} .env.production

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3030

CMD ["npm", "run", "start"]
