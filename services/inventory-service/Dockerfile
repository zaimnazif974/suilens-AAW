FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY src src
COPY tsconfig.json .

ENV NODE_ENV=production

EXPOSE 3004

CMD ["bun", "run", "start"]
