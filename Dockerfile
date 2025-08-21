FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3037

ENV NODE_ENV=production

RUN npx prisma generate

CMD [ "npm", "run", "dev" ]