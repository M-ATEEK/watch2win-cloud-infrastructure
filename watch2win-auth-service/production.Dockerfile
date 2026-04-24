FROM node:14-bullseye AS builder

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --production

COPY . .

FROM node:14-bullseye-slim AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=builder /usr/src/app /usr/src/app

EXPOSE 3001

CMD ["npm", "start"]
