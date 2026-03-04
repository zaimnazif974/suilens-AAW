FROM oven/bun:1.3-alpine
WORKDIR /app
COPY package.json ./
RUN bun install --force
COPY . .
EXPOSE 3001
CMD ["/bin/sh", "-c", "bun run db:push && bun run db:seed && bun run start"]
