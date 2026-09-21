# Build the React SPA, then serve it with the control server.
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server.cjs ./
COPY --from=build /app/dist ./dist

EXPOSE 3002
CMD ["node", "server.cjs"]
