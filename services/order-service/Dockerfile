FROM oven/bun:1.3-alpine
WORKDIR /app
COPY package.json ./
RUN bun install --force
COPY . .
EXPOSE 3002
CMD ["bun", "run", "start"]
