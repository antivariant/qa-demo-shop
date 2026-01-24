FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production

RUN npm run build

EXPOSE 3100

CMD ["npm", "run", "start"]
