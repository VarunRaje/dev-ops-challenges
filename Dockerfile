# Stage 1: pre-render markdown into static HTML (see scripts/build.mjs)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: serve the generated site
FROM nginx:alpine
RUN rm -rf /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html/
EXPOSE 80
