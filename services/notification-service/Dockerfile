FROM oven/bun:1.3-alpine
WORKDIR /app
COPY package.json ./
RUN bun install --force
COPY . .
EXPOSE 3003
CMD ["/bin/sh", "-c", "bun run db:push && bun run start"]
