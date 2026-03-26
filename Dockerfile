FROM node:25-alpine AS builder-base
FROM nginx:1-alpine AS runner-base

FROM builder-base AS builder
WORKDIR /app
COPY package.json package-lock.json .
RUN npm ci
COPY . .
RUN npm run build

FROM runner-base AS runner 
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80