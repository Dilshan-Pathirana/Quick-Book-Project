FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build

ENV NODE_ENV=production

CMD ["sh", "-c", "npm run start:railway"]
